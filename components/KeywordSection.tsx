"use client";

import { useMemo } from "react";
import type { KeywordHit, Review } from "@/lib/types";
import { extractBigrams, extractKeywords } from "@/lib/keywords";

interface KeywordSectionProps {
  allReviews: Review[];
}

export function KeywordSection({ allReviews }: KeywordSectionProps) {
  const positiveTexts = useMemo(
    () => allReviews.filter((r) => r.sentiment === "positive").map((r) => r.text),
    [allReviews]
  );
  const negativeTexts = useMemo(
    () => allReviews.filter((r) => r.sentiment === "negative").map((r) => r.text),
    [allReviews]
  );

  const positiveKeywords = useMemo(
    () => extractKeywords(positiveTexts),
    [positiveTexts]
  );
  const positivePhrases = useMemo(
    () => extractBigrams(positiveTexts),
    [positiveTexts]
  );
  const negativeKeywords = useMemo(
    () => extractKeywords(negativeTexts),
    [negativeTexts]
  );
  const negativePhrases = useMemo(
    () => extractBigrams(negativeTexts),
    [negativeTexts]
  );

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Keyword breakdown
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Frequency-ranked words and phrases pulled from positive and negative
          reviews.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <KeywordCard
          variant="positive"
          title="Positive keywords"
          phrases={positivePhrases}
          keywords={positiveKeywords}
        />
        <KeywordCard
          variant="negative"
          title="Negative keywords"
          phrases={negativePhrases}
          keywords={negativeKeywords}
        />
      </div>
    </section>
  );
}

const VARIANT = {
  positive: {
    accent: "text-positive-text",
    iconBg: "bg-positive-soft text-positive-text",
    chip: "border-positive-border bg-positive-bg text-positive-text",
    countBadge: "bg-white/70 text-positive-text",
  },
  negative: {
    accent: "text-negative-text",
    iconBg: "bg-negative-soft text-negative-text",
    chip: "border-negative-border bg-negative-bg text-negative-text",
    countBadge: "bg-white/70 text-negative-text",
  },
} as const;

function KeywordCard({
  variant,
  title,
  phrases,
  keywords,
}: {
  variant: "positive" | "negative";
  title: string;
  phrases: KeywordHit[];
  keywords: KeywordHit[];
}) {
  const v = VARIANT[variant];
  const hasContent = phrases.length > 0 || keywords.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${v.iconBg}`}
        >
          <TagIcon />
        </span>
        <h4 className={`text-sm font-semibold ${v.accent}`}>{title}</h4>
      </div>

      {!hasContent ? (
        <p className="mt-4 text-sm italic text-slate-400">
          Not enough reviews to extract keywords.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {phrases.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recurring phrases · {phrases.length}
              </p>
              <ChipList items={phrases} chipCls={v.chip} badgeCls={v.countBadge} />
            </div>
          )}
          {keywords.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Top keywords · {keywords.length}
              </p>
              <ChipList items={keywords} chipCls={v.chip} badgeCls={v.countBadge} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChipList({
  items,
  chipCls,
  badgeCls,
}: {
  items: KeywordHit[];
  chipCls: string;
  badgeCls: string;
}) {
  const max = items[0]?.count ?? 1;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((k) => {
        const w = k.count / max;
        const sizeCls =
          w > 0.66 ? "text-sm" : w > 0.33 ? "text-xs" : "text-[11px]";
        return (
          <li
            key={k.word}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${chipCls} ${sizeCls}`}
            title={`${k.count} occurrence${k.count === 1 ? "" : "s"}`}
          >
            <span>{k.word}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${badgeCls}`}
            >
              {k.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function TagIcon() {
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
      <path d="M20.59 13.41 12 22l-9-9V3h10z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}
