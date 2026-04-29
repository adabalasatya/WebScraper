"use client";

import { useMemo, useState } from "react";
import type { KeywordHit, Review } from "@/lib/types";
import type { Sentiment } from "@/lib/sentiment";
import { extractBigrams, extractKeywords } from "@/lib/keywords";

interface InsightSummaryProps {
  variant: "positive" | "negative";
  title: string;
  allReviews: Review[];
}

const VARIANT = {
  positive: {
    accent: "text-positive-text",
    iconBg: "bg-positive-soft text-positive-text",
    quoteBar: "border-positive-accent",
    sentiment: "positive" as Sentiment,
    headline: "Users most often praise",
    summaryEmpty: "Not enough positive reviews yet to surface clear themes.",
    examplesLabel: "Sample praise",
  },
  negative: {
    accent: "text-negative-text",
    iconBg: "bg-negative-soft text-negative-text",
    quoteBar: "border-negative-accent",
    sentiment: "negative" as Sentiment,
    headline: "Top complaints focus on",
    summaryEmpty: "Not enough negative reviews yet to surface clear themes.",
    examplesLabel: "Sample complaints",
  },
} as const;

const DEFAULT_THEME_LIMIT = 4;
const MAX_EXAMPLES_PER_THEME = 2;
const EXAMPLE_MAX_CHARS = 220;

export function InsightSummary({
  variant,
  title,
  allReviews,
}: InsightSummaryProps) {
  const v = VARIANT[variant];

  // Newest-first list of every fetched review matching this polarity.
  const polarityReviews = useMemo(() => {
    return allReviews
      .filter((r) => r.sentiment === v.sentiment)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [allReviews, v.sentiment]);

  const { phrases, keywords } = useMemo(() => {
    const texts = polarityReviews.map((r) => r.text);
    return {
      phrases: extractBigrams(texts),
      keywords: extractKeywords(texts),
    };
  }, [polarityReviews]);

  const [showAll, setShowAll] = useState(false);

  // All deduped themes (phrases first, then unigram keywords).
  const allThemes = useMemo(() => {
    const seen = new Set<string>();
    const out: KeywordHit[] = [];
    for (const t of [...phrases, ...keywords]) {
      const k = t.word.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }, [phrases, keywords]);

  const visibleThemes = showAll
    ? allThemes
    : allThemes.slice(0, DEFAULT_THEME_LIMIT);

  const themeExamples = useMemo(
    () =>
      visibleThemes.map((t) => ({
        theme: t,
        examples: findExamples(polarityReviews, t.word, variant),
      })),
    [visibleThemes, polarityReviews, variant]
  );

  // Summary sentence is always built from the top-N (constant) so it doesn't
  // bloat when "Show all" is on.
  const summarySentence = buildSummarySentence(
    allThemes.slice(0, DEFAULT_THEME_LIMIT),
    v.headline,
    v.summaryEmpty
  );

  const hasContent = allThemes.length > 0;
  const hasMoreThemes = allThemes.length > DEFAULT_THEME_LIMIT;

  return (
    <section className="flex h-full max-h-[40rem] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <header className="flex shrink-0 items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${v.iconBg}`}
        >
          {variant === "positive" ? <ThumbUpIcon /> : <ThumbDownIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className={`text-sm font-semibold ${v.accent}`}>{title}</h3>
            <span className="text-[11px] font-medium text-slate-500">
              {polarityReviews.length} review
              {polarityReviews.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {summarySentence}
          </p>
        </div>
      </header>

      {hasContent && (
        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {v.examplesLabel}
          </p>
          <div className="-mr-2 mt-3 flex-1 overflow-y-auto pr-2">
            <ul className="space-y-3">
              {themeExamples.map(({ theme, examples }) => (
                <li
                  key={theme.word}
                  className={`rounded-xl border-l-4 bg-slate-50 p-3 ${v.quoteBar}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={`text-sm font-semibold ${v.accent}`}>
                      “{theme.word}”
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">
                      {theme.count} mention{theme.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  {examples.length === 0 ? (
                    <p className="mt-1 text-xs italic text-slate-400">
                      No example review captured for this theme.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {examples.map((ex) => (
                        <li
                          key={ex.id}
                          className="text-xs leading-relaxed text-slate-700"
                        >
                          <Highlight
                            text={truncate(ex.text, EXAMPLE_MAX_CHARS)}
                            phrase={theme.word}
                          />
                          <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
                            — {ex.userName} · {ex.rating}★
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {hasMoreThemes && (
            <div className="mt-3 flex shrink-0 justify-center border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition hover:bg-slate-50 ${v.accent}`}
              >
                {showAll ? (
                  <>
                    Show fewer
                    <ChevronUpIcon />
                  </>
                ) : (
                  <>
                    Show all themes ({allThemes.length - DEFAULT_THEME_LIMIT}{" "}
                    more)
                    <ChevronDownIcon />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function buildSummarySentence(
  themes: KeywordHit[],
  headline: string,
  emptyFallback: string
): string {
  if (themes.length === 0) return emptyFallback;
  const top = themes[0];
  const rest = themes.slice(1, 4).map((t) => `“${t.word}”`);
  let sentence = `${headline} “${top.word}” (${top.count} mention${
    top.count === 1 ? "" : "s"
  })`;
  if (rest.length > 0) {
    sentence += `. Also recurring: ${rest.join(", ")}.`;
  } else {
    sentence += ".";
  }
  return sentence;
}

function findExamples(
  reviews: Review[],
  phrase: string,
  variant: "positive" | "negative"
): Review[] {
  const lower = phrase.toLowerCase();
  const matches = reviews.filter((r) => r.text.toLowerCase().includes(lower));
  matches.sort((a, b) => {
    if (variant === "positive") {
      if (b.rating !== a.rating) return b.rating - a.rating;
    } else {
      if (a.rating !== b.rating) return a.rating - b.rating;
    }
    return b.text.length - a.text.length;
  });
  return matches.slice(0, MAX_EXAMPLES_PER_THEME);
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max - 30 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
}

function Highlight({ text, phrase }: { text: string; phrase: string }) {
  if (!text || !phrase) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let safety = 0;
  while (cursor < text.length && safety++ < 50) {
    const idx = lower.indexOf(lowerPhrase, cursor);
    if (idx === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark
        key={`${idx}-${parts.length}`}
        className="rounded bg-amber-100 px-0.5 text-slate-900"
      >
        {text.slice(idx, idx + phrase.length)}
      </mark>
    );
    cursor = idx + phrase.length;
  }
  return <>{parts}</>;
}

/* icons */
function ThumbUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
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
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M17 14V3" />
      <path d="M10 20l1-6H5a2 2 0 0 1-2-2.3l1.4-7a2 2 0 0 1 2-1.7h10v11l-4 7a2 2 0 0 1-3-1Z" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3 w-3"
      aria-hidden
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
