import type { AppInfo } from "@/lib/types";

interface AppInfoCardProps {
  app: AppInfo;
  fetchedAt: string;
  reviewCount: number;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function fmtDate(ts?: number): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AppInfoCard({ app, fetchedAt, reviewCount }: AppInfoCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
        {app.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={app.icon}
            alt=""
            className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm sm:h-24 sm:w-24"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 sm:h-24 sm:w-24">
            ?
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">
                {app.title}
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-600">
                {app.developer}
                {app.genre && (
                  <span className="text-slate-400"> · {app.genre}</span>
                )}
              </p>
            </div>
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Open in Play Store
              <ExternalIcon />
            </a>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Avg rating"
              value={app.score ? app.score.toFixed(2) : "—"}
              accent="text-amber-500"
              icon={<StarIcon />}
              sub={`${fmtNumber(app.ratings)} ratings`}
            />
            <Metric
              label="Total reviews"
              value={fmtNumber(app.reviews)}
              accent="text-indigo-500"
              icon={<CommentsIcon />}
              sub={`${reviewCount} fetched`}
            />
            <Metric
              label="Installs"
              value={app.installs}
              accent="text-emerald-500"
              icon={<DownloadIcon />}
            />
            <Metric
              label="Version"
              value={app.version || "—"}
              accent="text-slate-500"
              icon={<TagIcon />}
              sub={fmtDate(app.updated) ?? undefined}
            />
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Snapshot fetched {new Date(fetchedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className={accent}>{icon}</span>
        {label}
      </div>
      <p className="mt-1 truncate text-base font-semibold text-slate-900">
        {value}
      </p>
      {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function svg(children: React.ReactNode, cls = "h-3.5 w-3.5") {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
      aria-hidden
    >
      {children}
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M12 2.5l2.95 5.97 6.59.96-4.77 4.65 1.13 6.57L12 17.77l-5.9 3.1 1.13-6.57L2.46 9.43l6.59-.96L12 2.5z" />
    </svg>
  );
}
function CommentsIcon() {
  return svg(<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />);
}
function DownloadIcon() {
  return svg(
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  );
}
function TagIcon() {
  return svg(
    <>
      <path d="M20.59 13.41 12 22l-9-9V3h10z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  );
}
function ExternalIcon() {
  return svg(
    <>
      <path d="M14 4h6v6" />
      <path d="M10 14 20 4" />
      <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </>,
    "h-3 w-3"
  );
}
