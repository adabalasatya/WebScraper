interface KeywordChipsProps {
  keywords: { word: string; count: number }[];
}

export function KeywordChips({ keywords }: KeywordChipsProps) {
  if (keywords.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No negative reviews to extract keywords from.
      </p>
    );
  }

  const max = keywords[0]?.count ?? 1;

  return (
    <ul className="flex flex-wrap gap-2">
      {keywords.map((k) => {
        const weight = k.count / max;
        // Subtle font-size variation for a tag-cloud feel
        const sizeClass =
          weight > 0.66
            ? "text-sm"
            : weight > 0.33
            ? "text-xs"
            : "text-[11px]";
        return (
          <li
            key={k.word}
            className={`group inline-flex items-center gap-1.5 rounded-full border border-negative-border bg-negative-bg px-3 py-1 font-medium text-negative-text transition hover:bg-negative-soft ${sizeClass}`}
            title={`${k.count} occurrence${k.count === 1 ? "" : "s"}`}
          >
            <span>{k.word}</span>
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-negative-text">
              {k.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
