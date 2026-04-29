"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";
import type { AiInsightResult, AiTheme } from "@/lib/aiInsight";

interface Props {
  allReviews: Review[];
}

interface PanelState {
  loading: boolean;
  error: string | null;
  data: AiInsightResult | null;
}

const INITIAL: PanelState = { loading: false, error: null, data: null };

export function AiInsightPanel({ allReviews }: Props) {
  const positiveReviews = allReviews.filter((r) => r.sentiment === "positive");
  const negativeReviews = allReviews.filter((r) => r.sentiment === "negative");

  const [positive, setPositive] = useState<PanelState>(INITIAL);
  const [negative, setNegative] = useState<PanelState>(INITIAL);

  async function callApi(
    polarity: "positive" | "negative",
    reviews: Review[],
    setState: React.Dispatch<React.SetStateAction<PanelState>>
  ) {
    setState({ loading: true, error: null, data: null });
    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polarity, reviews }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({
          loading: false,
          error: json?.error ?? `Request failed (${res.status})`,
          data: null,
        });
        return;
      }
      setState({ loading: false, error: null, data: json as AiInsightResult });
    } catch (e) {
      setState({
        loading: false,
        error: e instanceof Error ? e.message : "Network error",
        data: null,
      });
    }
  }

  function analyzeAll() {
    if (positiveReviews.length > 0) {
      callApi("positive", positiveReviews, setPositive);
    }
    if (negativeReviews.length > 0) {
      callApi("negative", negativeReviews, setNegative);
    }
  }

  const anyLoading = positive.loading || negative.loading;
  const anyData = positive.data || negative.data;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40 p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <SparkleIcon />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              AI insight
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Themes grouped semantically — synonyms merged, plain-English summaries.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={analyzeAll}
          disabled={anyLoading || allReviews.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-indigo-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {anyLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing…
            </>
          ) : anyData ? (
            <>
              <RefreshIcon />
              Re-analyze
            </>
          ) : (
            <>
              <SparkleIcon />
              Generate AI insight
            </>
          )}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ResultCard
          variant="positive"
          title="What users love (Strengths)"
          state={positive}
          reviewCount={positiveReviews.length}
        />
        <ResultCard
          variant="negative"
          title="What users hate (Weaknesses)"
          state={negative}
          reviewCount={negativeReviews.length}
        />
      </div>

      {anyData && (
        <p className="mt-4 text-[11px] text-slate-400">
          Powered by{" "}
          <span className="font-medium">
            {positive.data?.source === "gemini" || negative.data?.source === "gemini"
              ? "Gemini (Groq fallback)"
              : "Groq · Llama 3.3 70B"}
          </span>
          . Up to 150 reviews per side analyzed.
        </p>
      )}
    </section>
  );
}

const VARIANT = {
  positive: {
    accent: "text-positive-text",
    iconBg: "bg-positive-soft text-positive-text",
    chipBg: "bg-positive-bg text-positive-text border-positive-border",
    quoteBar: "border-positive-accent",
  },
  negative: {
    accent: "text-negative-text",
    iconBg: "bg-negative-soft text-negative-text",
    chipBg: "bg-negative-bg text-negative-text border-negative-border",
    quoteBar: "border-negative-accent",
  },
} as const;

function ResultCard({
  variant,
  title,
  state,
  reviewCount,
}: {
  variant: "positive" | "negative";
  title: string;
  state: PanelState;
  reviewCount: number;
}) {
  const v = VARIANT[variant];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex items-start gap-3">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${v.iconBg}`}
        >
          {variant === "positive" ? <ThumbUpIcon /> : <ThumbDownIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-semibold ${v.accent}`}>{title}</h4>
          <p className="text-[11px] text-slate-500">
            {reviewCount} review{reviewCount === 1 ? "" : "s"} on this side
          </p>
        </div>
      </header>

      <div className="mt-4 flex-1">
        {state.loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
            Asking the model…
          </div>
        )}
        {state.error && !state.loading && (
          <p className="text-sm text-rose-600">{state.error}</p>
        )}
        {!state.loading && !state.error && !state.data && (
          <p className="text-sm italic text-slate-400">
            Click <span className="font-medium">Generate AI insight</span> to
            analyze.
          </p>
        )}
        {state.data && (
          <>
            <p className="text-sm leading-relaxed text-slate-800">
              {state.data.tldr}
            </p>
            {state.data.themes.length > 0 && (
              <ul className="mt-4 space-y-3">
                {state.data.themes.map((t, i) => (
                  <ThemeRow key={i} theme={t} variant={variant} />
                ))}
              </ul>
            )}
            <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-400">
              {state.data.reviewsAnalyzed} reviews analyzed · {state.data.source}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ThemeRow({
  theme,
  variant,
}: {
  theme: AiTheme;
  variant: "positive" | "negative";
}) {
  const v = VARIANT[variant];
  const freqStyle =
    theme.frequency === "high"
      ? "bg-slate-900 text-white"
      : theme.frequency === "medium"
      ? "bg-slate-200 text-slate-700"
      : "bg-slate-100 text-slate-500";
  return (
    <li className={`rounded-xl border-l-4 bg-slate-50 p-3 ${v.quoteBar}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className={`text-sm font-semibold ${v.accent}`}>{theme.title}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${freqStyle}`}
        >
          {theme.frequency}
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-700">
        {theme.summary}
      </p>
      {theme.exampleQuotes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {theme.exampleQuotes.map((q, i) => (
            <li
              key={i}
              className="text-[11px] italic leading-relaxed text-slate-500"
            >
              “{q}”
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* icons */
function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z" />
      <path d="M19 14v4M17 16h4M5 5v2M4 6h2" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}
function ThumbUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M7 10v11" />
      <path d="M14 4l-1 6h6a2 2 0 0 1 2 2.3l-1.4 7a2 2 0 0 1-2 1.7H7V10l4-7a2 2 0 0 1 3 1Z" />
    </svg>
  );
}
function ThumbDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M17 14V3" />
      <path d="M10 20l1-6H5a2 2 0 0 1-2-2.3l1.4-7a2 2 0 0 1 2-1.7h10v11l-4 7a2 2 0 0 1-3-1Z" />
    </svg>
  );
}
