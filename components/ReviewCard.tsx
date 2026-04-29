import type { Review } from "@/lib/types";

const SENTIMENT_STYLE: Record<
  Review["sentiment"],
  { label: string; chip: string; accent: string; dot: string }
> = {
  positive: {
    label: "Positive",
    chip: "bg-positive-bg text-positive-text border-positive-border",
    accent: "bg-positive-accent",
    dot: "bg-positive-accent",
  },
  neutral: {
    label: "Neutral",
    chip: "bg-neutral-bg text-neutral-text border-neutral-border",
    accent: "bg-neutral-accent",
    dot: "bg-neutral-accent",
  },
  negative: {
    label: "Negative",
    chip: "bg-negative-bg text-negative-text border-negative-border",
    accent: "bg-negative-accent",
    dot: "bg-negative-accent",
  },
};

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span aria-label={`${rating} out of 5`} className="inline-flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${i < full ? "fill-amber-400" : "fill-slate-200"}`}
          aria-hidden
        >
          <path d="M12 2.5l2.95 5.97 6.59.96-4.77 4.65 1.13 6.57L12 17.77l-5.9 3.1 1.13-6.57L2.46 9.43l6.59-.96L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initial(name: string) {
  const c = (name || "?").trim().charAt(0);
  return c ? c.toUpperCase() : "?";
}

export function ReviewCard({ review }: { review: Review }) {
  const style = SENTIMENT_STYLE[review.sentiment];
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
      <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden />
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${style.dot}`}
              aria-hidden
            >
              {initial(review.userName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {review.userName}
              </p>
              <p className="text-xs text-slate-500">{formatDate(review.date)}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${style.chip}`}
          >
            {style.label}
          </span>
        </header>

        <div className="mt-3 flex items-center gap-2">
          <Stars rating={review.rating} />
          <span className="text-xs font-medium tabular-nums text-slate-500">
            {review.rating}/5
          </span>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {review.text || (
            <span className="italic text-slate-400">No review text.</span>
          )}
        </p>
      </div>
    </article>
  );
}
