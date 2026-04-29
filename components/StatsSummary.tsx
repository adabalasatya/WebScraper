interface StatsSummaryProps {
  stats: { total: number; positive: number; neutral: number; negative: number };
}

function pctNum(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const items = [
    {
      key: "total",
      label: "Total reviews",
      value: stats.total,
      ringClass: "bg-slate-100 text-slate-600",
      barClass: "bg-slate-400",
      icon: <CommentsIcon />,
      pct: 100,
    },
    {
      key: "positive",
      label: "Positive",
      value: stats.positive,
      ringClass: "bg-positive-soft text-positive-text",
      barClass: "bg-positive-accent",
      icon: <SmileIcon />,
      pct: pctNum(stats.positive, stats.total),
    },
    {
      key: "neutral",
      label: "Neutral",
      value: stats.neutral,
      ringClass: "bg-neutral-soft text-neutral-text",
      barClass: "bg-neutral-accent",
      icon: <MehIcon />,
      pct: pctNum(stats.neutral, stats.total),
    },
    {
      key: "negative",
      label: "Negative",
      value: stats.negative,
      ringClass: "bg-negative-soft text-negative-text",
      barClass: "bg-negative-accent",
      icon: <FrownIcon />,
      pct: pctNum(stats.negative, stats.total),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.key}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:shadow-pop"
        >
          <div className="flex items-start justify-between">
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${it.ringClass}`}
            >
              {it.icon}
            </span>
            {it.key !== "total" && (
              <span className="text-xs font-semibold tabular-nums text-slate-500">
                {it.pct}%
              </span>
            )}
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            {it.label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
            {it.value}
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${it.barClass}`}
              style={{ width: `${it.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function iconBase(children: React.ReactNode) {
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

function CommentsIcon() {
  return iconBase(
    <>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />
    </>
  );
}
function SmileIcon() {
  return iconBase(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  );
}
function MehIcon() {
  return iconBase(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 15h8" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  );
}
function FrownIcon() {
  return iconBase(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  );
}
