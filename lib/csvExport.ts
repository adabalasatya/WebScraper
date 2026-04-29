import type { ReviewsResponse } from "./types";

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Escape quotes by doubling them, wrap if it contains comma/quote/newline.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(",");
}

export function exportReviewsCsv(data: ReviewsResponse): void {
  const header = ["id", "userName", "rating", "sentiment", "date", "text"];
  const lines = [row(header)];
  for (const r of data.reviews) {
    lines.push(
      row([
        r.id,
        r.userName,
        r.rating,
        r.sentiment,
        r.date,
        r.text.replace(/\r?\n/g, " "),
      ])
    );
  }
  // Prepend BOM so Excel opens UTF-8 correctly.
  const csv = "﻿" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.appId}-reviews.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
