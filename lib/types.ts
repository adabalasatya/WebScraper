import type { Sentiment } from "./sentiment";

export interface Review {
  id: string;
  userName: string;
  text: string;
  rating: number;
  date: string; // ISO string
  sentiment: Sentiment;
}

export interface AppInfo {
  appId: string;
  title: string;
  developer: string;
  icon: string;
  score: number; // average rating
  ratings: number; // total ratings count
  reviews: number; // total reviews count
  installs: string;
  version?: string;
  updated?: number; // ms timestamp
  genre?: string;
  url: string;
  recentChanges?: string;
  released?: string;
}

export type RatingDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

export interface KeywordHit {
  word: string;
  count: number;
}

export interface InsightSet {
  keywords: KeywordHit[];
  phrases: KeywordHit[];
}

export interface ReviewsResponse {
  appId: string;
  fetchedAt: string;
  count: number;
  appInfo: AppInfo | null;
  ratingDistribution: RatingDistribution;
  stats: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  insights: {
    positive: InsightSet;
    negative: InsightSet;
  };
  reviews: Review[];
}
