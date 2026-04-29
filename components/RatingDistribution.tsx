import type { RatingDistribution as RatingDist } from "@/lib/types";

interface RatingDistributionProps {
  distribution: RatingDist;
  source?: "store" | "fetched";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const BAR_COLOR: Record<string, string> = {
  "5": "bg-emerald-500",
  "4": "bg-emerald-400",
  "3": "bg-amber-400",
  "2": "bg-rose-400",
  "1": "bg-rose-500",
};

export function RatingDistribution({
  distribution,
  source = "store",
}: RatingDistributionProps) {
  const order: ("5" | "4" | "3" | "2" | "1")[] = ["5", "4", "3", "2", "1"];
  const total = order.reduce((s, k) => s + (distribution[k] ?? 0), 0);
  const max = Math.max(...order.map((k) => distribution[k] ?? 0), 1);

  const weightedSum = order.reduce(
    (s, k) => s + Number(k) * (distribution[k] ?? 0),
    0
  );
  const avg = total > 0 ? weightedSum / total : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Rating distribution
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {source === "store"
              ? "Lifetime rating histogram from the Play Store."
              : "Computed from the fetched review sample."}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-slate-900">
            {avg.toFixed(2)}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            {fmt(total)} ratings
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {order.map((k) => {
          const v = distribution[k] ?? 0;
          const pct = max > 0 ? (v / max) * 100 : 0;
          const sharePct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <div key={k} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-600">
                {k}★
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${BAR_COLOR[k]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-600">
                {fmt(v)}
              </span>
              <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500">
                {sharePct}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
