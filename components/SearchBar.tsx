"use client";

import { FormEvent, useState } from "react";

export const LIMIT_PRESETS: { value: number; label: string }[] = [
  { value: 200, label: "200 (fast)" },
  { value: 500, label: "500" },
  { value: 1000, label: "1,000" },
  { value: 2000, label: "2,000" },
  { value: 5000, label: "5,000" },
  { value: 10000, label: "Max (~10,000)" },
];

interface SearchBarProps {
  onSubmit: (input: string, limit: number) => void;
  loading: boolean;
  initialValue?: string;
  initialLimit?: number;
}

export function SearchBar({
  onSubmit,
  loading,
  initialValue = "",
  initialLimit = 200,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [limit, setLimit] = useState<number>(initialLimit);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, limit);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="App ID (com.daily.mydiary) or full Play Store URL"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-indigo-600 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:from-indigo-300 disabled:to-indigo-300 disabled:shadow-none"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Fetching…
            </>
          ) : (
            <>
              Fetch Reviews
              <ArrowRightIcon />
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <label htmlFor="limit-select" className="font-medium text-slate-700">
          Fetch up to:
        </label>
        <select
          id="limit-select"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          disabled={loading}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
        >
          {LIMIT_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <span className="text-slate-400">
          {limit >= 2000
            ? "· large fetches can take 30–90 seconds"
            : "· typically 5–15 seconds"}
        </span>
      </div>
    </form>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 transition group-hover:translate-x-0.5"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
