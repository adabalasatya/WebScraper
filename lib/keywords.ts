// Lightweight keyword extractor: tokenize, drop stopwords/short tokens, rank by frequency.
const STOPWORDS = new Set<string>([
  "the", "a", "an", "and", "or", "but", "if", "then", "else", "for", "of", "to",
  "in", "on", "at", "by", "with", "from", "as", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "should", "could", "can", "may", "might", "must", "shall", "i", "me", "my",
  "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "it",
  "its", "they", "them", "their", "this", "that", "these", "those", "there",
  "here", "what", "which", "who", "whom", "whose", "when", "where", "why",
  "how", "all", "any", "both", "each", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
  "very", "just", "also", "really", "much", "ever", "still", "even", "out",
  "up", "down", "off", "over", "under", "again", "once", "now", "get", "got",
  "make", "made", "go", "going", "gone", "use", "used", "using", "app", "apps",
  "please", "thanks", "thank", "well", "want", "need", "like", "lot", "things",
  "time", "day", "way", "thing", "im", "ive", "dont", "cant", "wont", "didnt",
  "doesnt", "isnt", "wasnt", "werent", "havent", "hasnt", "shouldnt", "wouldnt",
  "couldnt", "youre", "theyre", "weve", "theyve", "into", "back", "ive",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/'/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(
  texts: string[],
  limit = 15
): { word: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const text of texts) {
    if (!text) continue;
    for (const tok of tokenize(text)) {
      if (tok.length < 4) continue;
      if (STOPWORDS.has(tok)) continue;
      if (/^\d+$/.test(tok)) continue;
      counts.set(tok, (counts.get(tok) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

// Bigrams: two consecutive non-stopword tokens. Surface meaningful phrases like
// "battery life", "user interface", "customer service".
export function extractBigrams(
  texts: string[],
  limit = 10
): { word: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const text of texts) {
    if (!text) continue;
    const tokens = tokenize(text);
    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i];
      const b = tokens[i + 1];
      if (a.length < 3 || b.length < 3) continue;
      if (STOPWORDS.has(a) || STOPWORDS.has(b)) continue;
      if (/^\d+$/.test(a) || /^\d+$/.test(b)) continue;
      const phrase = `${a} ${b}`;
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .filter((k) => k.count >= 2) // require at least 2 occurrences for phrases
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}
