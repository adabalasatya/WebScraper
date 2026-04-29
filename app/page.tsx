"use client";

import { useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { StatsSummary } from "@/components/StatsSummary";
import { ReviewCard } from "@/components/ReviewCard";
import { AppInfoCard } from "@/components/AppInfoCard";
import { RatingDistribution } from "@/components/RatingDistribution";
import { InsightSummary } from "@/components/InsightSummary";
import { KeywordSection } from "@/components/KeywordSection";
import { AiInsightPanel } from "@/components/AiInsightPanel";
import type { ReviewsResponse } from "@/lib/types";
import type { Sentiment } from "@/lib/sentiment";

type Filter = "all" | Sentiment;
type SortMode = "newest" | "oldest" | "highest" | "lowest" | "longest";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
  { key: "longest", label: "Longest text" },
];

export default function HomePage() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [exporting, setExporting] = useState<"none" | "json" | "csv" | "pdf">(
    "none"
  );
  const [pendingLimit, setPendingLimit] = useState<number>(200);

  async function handleFetch(input: string, limit: number) {
    setLoading(true);
    setError(null);
    setData(null);
    setFilter("all");
    setSort("newest");
    setQuery("");
    setVisible(PAGE_SIZE);
    setPendingLimit(limit);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, limit }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload?.error ?? `Request failed with status ${res.status}`);
        return;
      }
      setData(payload as ReviewsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const filteredReviews = useMemo(() => {
    if (!data) return [];
    let out = data.reviews;
    if (filter !== "all") out = out.filter((r) => r.sentiment === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q)
      );
    }
    const sorted = [...out];
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => +new Date(a.date) - +new Date(b.date));
        break;
      case "highest":
        sorted.sort(
          (a, b) => b.rating - a.rating || +new Date(b.date) - +new Date(a.date)
        );
        break;
      case "lowest":
        sorted.sort(
          (a, b) => a.rating - b.rating || +new Date(b.date) - +new Date(a.date)
        );
        break;
      case "longest":
        sorted.sort((a, b) => b.text.length - a.text.length);
        break;
      case "newest":
      default:
        sorted.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    }
    return sorted;
  }, [data, filter, sort, query]);

  const shown = filteredReviews.slice(0, visible);
  const hasMore = visible < filteredReviews.length;

  function handleExportJson() {
    if (!data) return;
    setExporting("json");
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.appId}-reviews.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting("none");
    }
  }

  async function handleExportCsv() {
    if (!data) return;
    setExporting("csv");
    try {
      const { exportReviewsCsv } = await import("@/lib/csvExport");
      exportReviewsCsv(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export CSV");
    } finally {
      setExporting("none");
    }
  }

  async function handleExportPdf() {
    if (!data) return;
    setExporting("pdf");
    try {
      const { exportReviewsPdf } = await import("@/lib/exportPdf");
      exportReviewsPdf(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export PDF");
    } finally {
      setExporting("none");
    }
  }

  function applyFilter(next: Filter) {
    setFilter(next);
    setVisible(PAGE_SIZE);
  }

  const filters: { key: Filter; label: string; count: number; activeBg: string }[] = data
    ? [
        { key: "all", label: "All", count: data.stats.total, activeBg: "bg-slate-900 text-white" },
        { key: "positive", label: "Positive", count: data.stats.positive, activeBg: "bg-positive-accent text-white" },
        { key: "neutral", label: "Neutral", count: data.stats.neutral, activeBg: "bg-neutral-accent text-white" },
        { key: "negative", label: "Negative", count: data.stats.negative, activeBg: "bg-negative-accent text-white" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-hero-grad" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Competitor Review Intelligence
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Strengths &amp;{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
              Weaknesses
            </span>{" "}
            from Real Reviews
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Analyze any Google Play app to surface what users love (signals to
            replicate) and what they hate (gaps your app can win on).
          </p>

          {/* Search panel */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-card backdrop-blur sm:p-6">
            <SearchBar onSubmit={handleFetch} loading={loading} />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>Try:</span>
              <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
                com.spotify.music
              </code>
              <code className="hidden rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700 sm:inline">
                https://play.google.com/store/apps/details?id=com.daily.mydiary
              </code>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white py-16 shadow-card">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Fetching up to{" "}
              <span className="font-semibold text-indigo-700">
                {pendingLimit.toLocaleString()}
              </span>{" "}
              reviews from Google Play…
            </p>
            <p className="text-xs text-slate-500">
              {pendingLimit >= 2000
                ? "Large fetches can take 30–90 seconds. The Play Store may return fewer if it runs out of reviews."
                : "This usually takes 5–15 seconds."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-card"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertIcon />
            </span>
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5 text-rose-700">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state — pre-search */}
        {!loading && !error && !data && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <SparklesIcon />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Ready when you are
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
              Drop an app ID or Play Store URL into the search bar above to get
              started.
            </p>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="animate-fade-in-up space-y-8">
            {/* App info */}
            {data.appInfo && (
              <AppInfoCard
                app={data.appInfo}
                fetchedAt={data.fetchedAt}
                reviewCount={data.count}
              />
            )}

            {/* Export bar */}
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Snapshot
                </p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {data.count} reviews ·{" "}
                  <span className="text-positive-text">
                    {data.stats.positive} positive
                  </span>{" "}
                  ·{" "}
                  <span className="text-negative-text">
                    {data.stats.negative} negative
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButton
                  label="JSON"
                  loading={exporting === "json"}
                  onClick={handleExportJson}
                  disabled={exporting !== "none"}
                />
                <ExportButton
                  label="CSV"
                  loading={exporting === "csv"}
                  onClick={handleExportCsv}
                  disabled={exporting !== "none"}
                />
                <ExportButton
                  label="PDF"
                  primary
                  loading={exporting === "pdf"}
                  onClick={handleExportPdf}
                  disabled={exporting !== "none"}
                />
              </div>
            </section>

            <StatsSummary stats={data.stats} />

            {/* Rating distribution */}
            <RatingDistribution
              distribution={data.ratingDistribution}
              source={data.appInfo ? "store" : "fetched"}
            />

            {/* Strengths vs Weaknesses */}
            <section>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  What users say
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  A plain-language read of the recurring themes — each backed
                  by example reviews so you see the actual context, not just
                  word frequencies.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <InsightSummary
                  variant="positive"
                  title="What users love (Strengths)"
                  allReviews={data.reviews}
                />
                <InsightSummary
                  variant="negative"
                  title="What users hate (Weaknesses)"
                  allReviews={data.reviews}
                />
              </div>
            </section>

            {/* AI insight (Groq → Gemini fallback) */}
            <AiInsightPanel allReviews={data.reviews} />

            {/* Keyword breakdown (separate section, outside the summary cards) */}
            <KeywordSection allReviews={data.reviews} />

            {/* Reviews */}
            <section>
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Reviews
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {shown.length}
                    </span>{" "}
                    of {filteredReviews.length}
                  </p>
                </div>

                {/* Search + sort */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <SearchInputIcon />
                    </span>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setVisible(PAGE_SIZE);
                      }}
                      placeholder="Search inside reviews… (e.g. 'crash', 'subscription')"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as SortMode);
                      setVisible(PAGE_SIZE);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => {
                    const active = filter === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => applyFilter(f.key)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? `${f.activeBg} shadow-sm`
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {f.label}
                        <span
                          className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                            active
                              ? "bg-white/25 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  {query
                    ? `No reviews match "${query}".`
                    : "No reviews match this filter."}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {shown.map((r) => (
                      <ReviewCard key={r.id} review={r} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow"
                      >
                        Load more
                        <ChevronDownIcon />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ExportButton({
  label,
  loading,
  primary,
  onClick,
  disabled,
}: {
  label: string;
  loading: boolean;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60";
  const cls = primary
    ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow"
    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:shadow";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${cls}`}>
      {loading ? (
        <>
          <span
            className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${
              primary ? "border-indigo-400" : "border-slate-300"
            } border-t-transparent`}
          />
          Generating…
        </>
      ) : (
        <>
          <DownloadIcon />
          Export {label}
        </>
      )}
    </button>
  );
}

/* ---- inline icons ---- */

function svg(children: React.ReactNode, extraCls = "h-4 w-4") {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={extraCls}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function DownloadIcon() {
  return svg(
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>,
    "h-3.5 w-3.5"
  );
}
function ChevronDownIcon() {
  return svg(<path d="m6 9 6 6 6-6" />);
}
function AlertIcon() {
  return svg(
    <>
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </>,
    "h-4 w-4"
  );
}
function SparklesIcon() {
  return svg(
    <>
      <path d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z" />
      <path d="M19 14v4M17 16h4M5 5v2M4 6h2" />
    </>,
    "h-6 w-6"
  );
}
function SearchInputIcon() {
  return svg(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
    "h-4 w-4"
  );
}
