import { jsPDF } from "jspdf";
import type { Review, ReviewsResponse } from "./types";

const PAGE = { w: 210, h: 297 }; // A4 in mm
const MARGIN = 15;
const COL_GAP = 8;
const COL_W = (PAGE.w - 2 * MARGIN - COL_GAP) / 2;
const LEFT_X = MARGIN;
const RIGHT_X = MARGIN + COL_W + COL_GAP;
const BOTTOM = PAGE.h - MARGIN;
const LINE_H = 4.2;
const REVIEW_GAP = 4;

function stars(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

interface MeasuredReview {
  review: Review;
  userLines: string[];
  bodyLines: string[];
  height: number;
}

function measureReview(doc: jsPDF, r: Review): MeasuredReview {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const userLines = doc.splitTextToSize(r.userName, COL_W) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const bodyText = r.text?.trim() ? r.text : "(no text)";
  const bodyLines = doc.splitTextToSize(bodyText, COL_W) as string[];

  // header line + user lines + body lines + separator gap
  const height =
    LINE_H + LINE_H * userLines.length + LINE_H * bodyLines.length + REVIEW_GAP;
  return { review: r, userLines, bodyLines, height };
}

function drawReview(
  doc: jsPDF,
  m: MeasuredReview,
  x: number,
  yStart: number
): number {
  let y = yStart;

  // Header: stars + date (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  doc.text(`${stars(m.review.rating)}   ${fmtDate(m.review.date)}`, x, y);
  y += LINE_H;

  // Username (italic, gray)
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(m.userLines, x, y);
  y += LINE_H * m.userLines.length;

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(m.bodyLines, x, y);
  y += LINE_H * m.bodyLines.length;

  // Separator
  y += 1.5;
  doc.setDrawColor(220);
  doc.setLineWidth(0.1);
  doc.line(x, y, x + COL_W, y);
  y += REVIEW_GAP - 1.5;

  return y;
}

function drawTitleHeader(doc: jsPDF, data: ReviewsResponse): number {
  const titleLine =
    data.appInfo?.title ?? "Play Store Review Export";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text(titleLine, MARGIN, MARGIN + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);

  let y = MARGIN + 10;

  if (data.appInfo) {
    const meta1 = `${data.appInfo.developer || "—"}    ★ ${
      data.appInfo.score ? data.appInfo.score.toFixed(2) : "—"
    } / 5    ${data.appInfo.installs} installs`;
    doc.text(meta1, MARGIN, y);
    y += 4.5;
    doc.text(`App ID: ${data.appId}`, MARGIN, y);
    y += 4.5;
  } else {
    doc.text(`App: ${data.appId}`, MARGIN, y);
    y += 4.5;
  }

  doc.text(
    `Fetched: ${new Date(data.fetchedAt).toLocaleString()}`,
    MARGIN,
    y
  );
  y += 4.5;
  doc.text(
    `Sample of ${data.stats.total}   |   Positive ${data.stats.positive}   |   Neutral ${data.stats.neutral}   |   Negative ${data.stats.negative}`,
    MARGIN,
    y
  );
  y += 3;

  // Divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, PAGE.w - MARGIN, y);

  return y + 4;
}

function drawColumnHeaders(
  doc: jsPDF,
  yStart: number,
  posCount: number,
  negCount: number
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`Positive  (${posCount})`, LEFT_X, yStart);
  doc.setTextColor(153, 27, 27); // red-800
  doc.text(`Negative  (${negCount})`, RIGHT_X, yStart);
  doc.setTextColor(0);

  // underline
  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.4);
  doc.line(LEFT_X, yStart + 1.5, LEFT_X + COL_W, yStart + 1.5);
  doc.setDrawColor(153, 27, 27);
  doc.line(RIGHT_X, yStart + 1.5, RIGHT_X + COL_W, yStart + 1.5);

  return yStart + 6;
}

function drawFooter(doc: jsPDF, page: number, totalPages: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Page ${page} of ${totalPages}`, PAGE.w / 2, PAGE.h - 6, {
    align: "center",
  });
  doc.setTextColor(0);
}

export function exportReviewsPdf(data: ReviewsResponse): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const positives = data.reviews.filter((r) => r.sentiment === "positive");
  const negatives = data.reviews.filter((r) => r.sentiment === "negative");

  const posMeasured = positives.map((r) => measureReview(doc, r));
  const negMeasured = negatives.map((r) => measureReview(doc, r));

  let posIdx = 0;
  let negIdx = 0;
  let firstPage = true;

  // Render pages until both columns exhausted
  while (posIdx < posMeasured.length || negIdx < negMeasured.length) {
    if (!firstPage) doc.addPage();

    const headerEnd = firstPage
      ? drawTitleHeader(doc, data)
      : MARGIN + 4;

    const contentTop = drawColumnHeaders(
      doc,
      headerEnd,
      data.stats.positive,
      data.stats.negative
    );

    // Fill left (positive) column
    let leftY = contentTop;
    while (posIdx < posMeasured.length) {
      const m = posMeasured[posIdx];
      if (leftY + m.height > BOTTOM) break;
      leftY = drawReview(doc, m, LEFT_X, leftY);
      posIdx++;
    }

    // Fill right (negative) column
    let rightY = contentTop;
    while (negIdx < negMeasured.length) {
      const m = negMeasured[negIdx];
      if (rightY + m.height > BOTTOM) break;
      rightY = drawReview(doc, m, RIGHT_X, rightY);
      negIdx++;
    }

    // Edge case: a single review is taller than a full page. Force-render so we
    // don't loop forever; the bottom may overflow the margin slightly.
    if (
      leftY === contentTop &&
      rightY === contentTop &&
      (posIdx < posMeasured.length || negIdx < negMeasured.length)
    ) {
      if (posIdx < posMeasured.length) {
        drawReview(doc, posMeasured[posIdx], LEFT_X, contentTop);
        posIdx++;
      }
      if (negIdx < negMeasured.length) {
        drawReview(doc, negMeasured[negIdx], RIGHT_X, contentTop);
        negIdx++;
      }
    }

    firstPage = false;
  }

  // Handle the case where there are zero positive AND zero negative reviews:
  // still emit a page with the title so the PDF isn't empty.
  if (firstPage) {
    drawTitleHeader(doc, data);
    drawColumnHeaders(
      doc,
      MARGIN + 26,
      data.stats.positive,
      data.stats.negative
    );
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("No positive or negative reviews to display.", MARGIN, MARGIN + 40);
  }

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  doc.save(`${data.appId}-reviews.pdf`);
}
