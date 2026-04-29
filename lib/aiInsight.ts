import type { Review } from "./types";

export type AiFrequency = "low" | "medium" | "high";

export interface AiTheme {
  title: string;
  summary: string;
  frequency: AiFrequency;
  exampleQuotes: string[];
}

export interface AiInsightResult {
  tldr: string;
  themes: AiTheme[];
  source: "groq" | "gemini";
  modelUsed: string;
  reviewsAnalyzed: number;
}

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_REVIEWS_PER_CALL = 150;
const MAX_REVIEW_CHARS = 400;

function selectInformativeReviews(
  reviews: Review[],
  cap: number
): Review[] {
  if (reviews.length <= cap) return reviews;
  // Mix: half newest, half longest — gives the model recency + signal density.
  const newestSlice = [...reviews]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, Math.ceil(cap / 2));
  const seen = new Set(newestSlice.map((r) => r.id));
  const longestSlice = [...reviews]
    .filter((r) => !seen.has(r.id))
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, cap - newestSlice.length);
  return [...newestSlice, ...longestSlice];
}

function buildPrompt(
  reviews: Review[],
  polarity: "positive" | "negative"
): string {
  const sample = selectInformativeReviews(reviews, MAX_REVIEWS_PER_CALL);
  const lines = sample.map((r, i) => {
    const cleaned = r.text.replace(/\s+/g, " ").trim().slice(0, MAX_REVIEW_CHARS);
    return `[${i + 1}] (${r.rating}★) "${cleaned.replace(/"/g, "'")}"`;
  });

  const polarityWord = polarity === "positive" ? "POSITIVE (4-5 star)" : "NEGATIVE (1-2 star)";
  const focusHint =
    polarity === "negative"
      ? "For each theme, focus on the user's pain point (what's broken or annoying)."
      : "For each theme, focus on the strength (what users actively love).";

  return `You are a precise product analyst summarizing Google Play reviews for competitor intelligence.

Below are ${sample.length} ${polarityWord} reviews. Identify the top 5–7 distinct themes. CRITICAL: group reviews that talk about the same underlying topic into ONE theme even if they use different words. For example: "battery drain", "battery dies fast", "drains my battery" should all be ONE theme called something like "Battery drain".

${focusHint}

For each theme, provide:
- title: short plain-English label, 3-7 words. No quotation marks.
- summary: 1-2 sentence description of what users actually mean.
- frequency: rough estimate based on how many reviews mention it. Use "high" for ~25%+, "medium" for ~10-25%, "low" for under 10%.
- exampleQuotes: 2 short verbatim quotes (max 200 chars each) pulled directly from the reviews above.

Also provide:
- tldr: 1-2 sentences summarizing what users ${polarity === "positive" ? "love most" : "complain about most"}.

Respond with ONLY valid JSON. No markdown fences, no commentary. Schema:
{
  "tldr": "string",
  "themes": [
    {
      "title": "string",
      "summary": "string",
      "frequency": "low" | "medium" | "high",
      "exampleQuotes": ["string", "string"]
    }
  ]
}

REVIEWS:
${lines.join("\n")}`;
}

async function callGroq(prompt: string): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a data-driven product analyst. Always respond with valid JSON only — no markdown, no code fences, no commentary.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${text.slice(0, 240)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return JSON.parse(content);
}

async function callGemini(prompt: string): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 240)}`);
  }

  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini returned empty content");
  return JSON.parse(content);
}

function coerceFrequency(input: unknown): AiFrequency {
  if (typeof input !== "string") return "medium";
  const v = input.toLowerCase().trim();
  if (v === "low" || v === "medium" || v === "high") return v;
  return "medium";
}

function validateAndCoerce(raw: unknown): { tldr: string; themes: AiTheme[] } {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("AI response is not an object");
  }
  const obj = raw as Record<string, unknown>;
  const tldr = typeof obj.tldr === "string" ? obj.tldr.trim() : "";
  const rawThemes = Array.isArray(obj.themes) ? obj.themes : [];
  const themes: AiTheme[] = rawThemes.flatMap((t) => {
    if (typeof t !== "object" || t === null) return [];
    const tt = t as Record<string, unknown>;
    if (typeof tt.title !== "string" || typeof tt.summary !== "string") return [];
    const quotes = Array.isArray(tt.exampleQuotes)
      ? tt.exampleQuotes
          .filter((q): q is string => typeof q === "string")
          .map((q) => q.trim())
          .slice(0, 3)
      : [];
    return [
      {
        title: tt.title.trim(),
        summary: tt.summary.trim(),
        frequency: coerceFrequency(tt.frequency),
        exampleQuotes: quotes,
      },
    ];
  });
  return { tldr, themes };
}

export async function analyzeReviews(
  reviews: Review[],
  polarity: "positive" | "negative"
): Promise<AiInsightResult> {
  const sample = selectInformativeReviews(reviews, MAX_REVIEWS_PER_CALL);

  if (sample.length === 0) {
    return {
      tldr: `No ${polarity} reviews available to analyze.`,
      themes: [],
      source: "groq",
      modelUsed: GROQ_MODEL,
      reviewsAnalyzed: 0,
    };
  }

  const prompt = buildPrompt(reviews, polarity);

  // Try Groq first
  try {
    const raw = await callGroq(prompt);
    const validated = validateAndCoerce(raw);
    return {
      ...validated,
      source: "groq",
      modelUsed: GROQ_MODEL,
      reviewsAnalyzed: sample.length,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[ai-insight] Groq failed, falling back to Gemini:", err);
  }

  // Fall back to Gemini
  const raw = await callGemini(prompt);
  const validated = validateAndCoerce(raw);
  return {
    ...validated,
    source: "gemini",
    modelUsed: GEMINI_MODEL,
    reviewsAnalyzed: sample.length,
  };
}
