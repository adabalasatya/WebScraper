export type Sentiment = "positive" | "neutral" | "negative";

export function classifySentiment(rating: number): Sentiment {
  if (rating >= 4) return "positive";
  if (rating === 3) return "neutral";
  return "negative";
}

export function summarizeSentiments(
  reviews: { sentiment: Sentiment }[]
): { total: number; positive: number; neutral: number; negative: number } {
  const summary = { total: reviews.length, positive: 0, neutral: 0, negative: 0 };
  for (const r of reviews) summary[r.sentiment] += 1;
  return summary;
}
