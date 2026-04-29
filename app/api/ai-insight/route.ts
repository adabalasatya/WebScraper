import { NextRequest, NextResponse } from "next/server";
import { analyzeReviews } from "@/lib/aiInsight";
import type { Review } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { reviews?: Review[]; polarity?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const reviews = Array.isArray(body.reviews) ? body.reviews : [];
  const polarity = body.polarity === "negative" ? "negative" : "positive";

  if (reviews.length === 0) {
    return NextResponse.json(
      { error: "No reviews provided." },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeReviews(reviews, polarity);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 502 }
    );
  }
}
