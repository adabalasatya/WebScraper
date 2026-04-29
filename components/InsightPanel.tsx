import type { InsightSet } from "@/lib/types";

interface InsightPanelProps {
  variant: "positive" | "negative";
  title: string;
  subtitle: string;
  insight: InsightSet;
  reviewCount: number;
}

const VARIANT = {
  positive: {
    accent: "text-positive-text",
    iconBg: "bg-positive-soft text-positive-text",
    chip: "border-positive-border bg-positive-bg text-positive-text hover:bg-positive-soft",
    countBadge: "bg-white/70 text-positive-text",
  },
  negative: {
    accent: "text-negative-text",
    iconBg: "bg-negative-soft text-negative-text",
    chip: "border-negative-border bg-negative-bg text-negative-text hover:bg-negative-soft",
    countBadge: "bg-white/70 text-negative-text",
  },
} as const;

export function InsightPanel({
  variant,
  title,
  subtitle,
  insight,
  reviewCount,
}: InsightPanelProps) {
  const v = VARIANT[variant];
  const hasContent =
    insight.keywords.length > 0 || insight.phrases.length > 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${v.iconBg}`}
        >
          {variant === "positive" ? <ThumbUpIcon /> : <ThumbDownIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className={`text-sm font-semibold ${v.accent}`}>{title}</h3>
            <span className="text-[11px] text-slate-500">
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {!hasContent ? (
        <p className="mt-5 text-sm italic text-slate-400">
          Not enough data to extract insights yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {insight.phrases.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Recurring phrases
              </p>
              <ChipList items={insight.phrases} chipCls={v.chip} badgeCls={v.countBadge} />
            </div>
          )}
          {insight.keywords.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Top keywords
              </p>
              <ChipList items={insight.keywords} chipCls={v.chip} badgeCls={v.countBadge} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ChipList({
  items,
  chipCls,
  badgeCls,
}: {
  items: { word: string; count: number }[];
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition ${chipCls} ${sizeCls}`}
            title={`${k.count} occurrence${k.count === 1 ? "" : "s"}`}
          >
            <span>{k.word}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${badgeCls}`}>
              {k.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function svg(children: React.ReactNode) {
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
      {children}
    </svg>
  );
}
function ThumbUpIcon() {
  return svg(
    <>
      <path d="M7 10v11" />
      <path d="M14 4l-1 6h6a2 2 0 0 1 2 2.3l-1.4 7a2 2 0 0 1-2 1.7H7V10l4-7a2 2 0 0 1 3 1Z" />
    </>
  );
}
function ThumbDownIcon() {
  return svg(
    <>
      <path d="M17 14V3" />
      <path d="M10 20l1-6H5a2 2 0 0 1-2-2.3l1.4-7a2 2 0 0 1 2-1.7h10v11l-4 7a2 2 0 0 1-3-1Z" />
    </>
  );
}
