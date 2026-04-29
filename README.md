# Play Store Review Analyzer

A small Next.js (App Router) app that fetches Google Play reviews via
[`google-play-scraper`](https://www.npmjs.com/package/google-play-scraper) and
shows sentiment stats, filters, and top negative keywords.

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, paste an app ID (`com.daily.mydiary`) or full
Play Store URL, and hit **Fetch Reviews**.

## Structure

- `app/page.tsx` — dashboard UI (search, stats, filters, load-more, JSON export)
- `app/api/reviews/route.ts` — `GET`/`POST` endpoint, fetches ~200 newest reviews
- `components/` — `SearchBar`, `ReviewCard`, `StatsSummary`, `KeywordChips`
- `lib/extractAppId.ts` — URL/appId parsing helper
- `lib/sentiment.ts` — rating → sentiment classifier
- `lib/keywords.ts` — frequency-based keyword extraction
- `lib/types.ts` — shared types

## Sentiment rules

| Rating | Sentiment |
|--------|-----------|
| ≥ 4    | Positive  |
| = 3    | Neutral   |
| ≤ 2    | Negative  |
