import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";
import { extractAppId } from "@/lib/extractAppId";
import { classifySentiment, summarizeSentiments } from "@/lib/sentiment";
import { extractKeywords, extractBigrams } from "@/lib/keywords";
import type {
  AppInfo,
  RatingDistribution,
  Review,
  ReviewsResponse,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow long-running pagination on hosts that honor this hint (e.g. Vercel Pro).
// Local dev / self-hosted Node has no time cap.
export const maxDuration = 300;

const DEFAULT_LIMIT = 200;
const HARD_CAP = 10000;
const PAGE_SIZE_MAX = 200; // Play Store API tops out around ~200 per page
const MAX_PAGES = 200; // safety net: HARD_CAP / PAGE_SIZE_MAX with slack
// google-play-scraper enum value for sort.NEWEST (the package's bundled .d.ts
// types `sort` as a value rather than an enum, so we can't reference it as
// `gplay.sort.NEWEST` without a type error).
const SORT_NEWEST = 2;

function clampLimit(input: unknown): number {
  if (input === "max" || input === "all") return HARD_CAP;
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), HARD_CAP);
}

interface RawReview {
  id: string;
  userName?: string | null;
  text?: string | null;
  score?: number | null;
  date?: Date | string | null;
}

interface ReviewsPage {
  data: RawReview[];
  nextPaginationToken?: string;
}

interface RawAppInfo {
  appId?: string;
  title?: string;
  developer?: string;
  icon?: string;
  score?: number;
  ratings?: number;
  reviews?: number;
  installs?: string;
  version?: string;
  updated?: number;
  genre?: string;
  url?: string;
  recentChanges?: string;
  released?: string;
  histogram?: Record<string, number>;
}

async function fetchReviews(appId: string, target: number): Promise<Review[]> {
  const collected: Review[] = [];
  const seen = new Set<string>();
  let nextToken: string | undefined = undefined;
  let pages = 0;

  while (collected.length < target && pages < MAX_PAGES) {
    pages++;
    const result = (await gplay.reviews({
      appId,
      sort: SORT_NEWEST,
      num: PAGE_SIZE_MAX,
      paginate: true,
      nextPaginationToken: nextToken,
    })) as ReviewsPage;

    if (!result?.data || result.data.length === 0) break;

    for (const r of result.data) {
      if (!r?.id || seen.has(r.id)) continue;
      seen.add(r.id);

      const rating = Number(r.score) || 0;
      const dateValue =
        r.date instanceof Date
          ? r.date.toISOString()
          : r.date
          ? new Date(r.date).toISOString()
          : new Date().toISOString();

      collected.push({
        id: r.id,
        userName: r.userName ?? "Anonymous",
        text: r.text ?? "",
        rating,
        date: dateValue,
        sentiment: classifySentiment(rating),
      });
      if (collected.length >= target) break;
    }

    // Play Store stops handing out tokens once it's exhausted what it'll
    // surface for that app — at that point we're done regardless of target.
    if (!result.nextPaginationToken) break;
    nextToken = result.nextPaginationToken;
  }

  return collected
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, target);
}

async function fetchAppInfo(appId: string): Promise<{
  info: AppInfo | null;
  histogram: Record<string, number> | null;
}> {
  try {
    const raw = (await gplay.app({ appId })) as RawAppInfo;
    return {
      info: {
        appId: raw.appId ?? appId,
        title: raw.title ?? appId,
        developer: raw.developer ?? "",
        icon: raw.icon ?? "",
        score: typeof raw.score === "number" ? raw.score : 0,
        ratings: raw.ratings ?? 0,
        reviews: raw.reviews ?? 0,
        installs: raw.installs ?? "—",
        version: raw.version,
        updated: raw.updated,
        genre: raw.genre,
        url: raw.url ?? `https://play.google.com/store/apps/details?id=${appId}`,
        recentChanges: raw.recentChanges,
        released: raw.released,
      },
      histogram: raw.histogram ?? null,
    };
  } catch {
    return { info: null, histogram: null };
  }
}

function buildDistribution(
  histogram: Record<string, number> | null,
  reviews: Review[]
): RatingDistribution {
  if (histogram) {
    return {
      "1": histogram["1"] ?? 0,
      "2": histogram["2"] ?? 0,
      "3": histogram["3"] ?? 0,
      "4": histogram["4"] ?? 0,
      "5": histogram["5"] ?? 0,
    };
  }
  // Fallback: derive from the fetched reviews if app metadata is unavailable
  const dist: RatingDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of reviews) {
    const k = String(Math.max(1, Math.min(5, Math.round(r.rating)))) as keyof RatingDistribution;
    dist[k] += 1;
  }
  return dist;
}

function buildPayload(
  appId: string,
  reviews: Review[],
  appInfo: AppInfo | null,
  histogram: Record<string, number> | null
): ReviewsResponse {
  const stats = summarizeSentiments(reviews);
  const positiveTexts = reviews
    .filter((r) => r.sentiment === "positive")
    .map((r) => r.text);
  const negativeTexts = reviews
    .filter((r) => r.sentiment === "negative")
    .map((r) => r.text);

  return {
    appId,
    fetchedAt: new Date().toISOString(),
    count: reviews.length,
    appInfo,
    ratingDistribution: buildDistribution(histogram, reviews),
    stats,
    insights: {
      positive: {
        keywords: extractKeywords(positiveTexts),
        phrases: extractBigrams(positiveTexts),
      },
      negative: {
        keywords: extractKeywords(negativeTexts),
        phrases: extractBigrams(negativeTexts),
      },
    },
    reviews,
  };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function handle(input: string | null, limitInput: unknown) {
  const appId = extractAppId(input ?? "");
  if (!appId) {
    return errorResponse(
      "Invalid input. Provide an app ID (e.g. com.daily.mydiary) or a Play Store URL.",
      400
    );
  }

  const limit = clampLimit(limitInput);

  try {
    // Fetch reviews and app metadata in parallel
    const [reviews, appBundle] = await Promise.all([
      fetchReviews(appId, limit),
      fetchAppInfo(appId),
    ]);

    if (reviews.length === 0 && !appBundle.info) {
      return errorResponse(
        `App not found on Google Play: "${appId}".`,
        404
      );
    }
    if (reviews.length === 0) {
      return errorResponse(
        `No reviews available for "${appId}".`,
        404
      );
    }

    return NextResponse.json(
      buildPayload(appId, reviews, appBundle.info, appBundle.histogram)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (/App not found/i.test(message) || /404/.test(message)) {
      return errorResponse(`App not found on Google Play: "${appId}".`, 404);
    }
    return errorResponse(`Failed to fetch reviews: ${message}`, 500);
  }
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("appId");
  const limit = req.nextUrl.searchParams.get("limit");
  return handle(input, limit);
}

export async function POST(req: NextRequest) {
  let body: { appId?: string; input?: string; limit?: number | string } = {};
  try {
    body = await req.json();
  } catch {
    return errorResponse("Request body must be JSON.", 400);
  }
  return handle(body.appId ?? body.input ?? null, body.limit);
}
