import type { Market } from "@/types";

export const DEMO_DURATION_MS = 5 * 60 * 1000;

export function createMarkets(): Market[] {
  const now = Date.now();

  return [
    {
      id: "elon-twitter-attention",
      question: "Elon Musk Twitter Attention Index",
      category: "sentiment",
      topic: "Elon Musk",
      createdAt: now,
      closesAt: now + DEMO_DURATION_MS,
      status: "open",
      baseline: 43467,
      threshold: 25,
      thresholdType: "percentage",
      upParticipants: [],
      upBets: [],
      downParticipants: [],
      downBets: [],
      upPool: BigInt(0),
      downPool: BigInt(0),
      totalPot: BigInt(0),
    },
    {
      id: "ai-agents-narrative",
      question: "AI Agents Narrative Trend",
      category: "narrative",
      topic: "AI Agents",
      createdAt: now,
      closesAt: now + DEMO_DURATION_MS,
      status: "open",
      baseline: 12500,
      threshold: 25,
      thresholdType: "percentage",
      upParticipants: [],
      upBets: [],
      downParticipants: [],
      downBets: [],
      upPool: BigInt(0),
      downPool: BigInt(0),
      totalPot: BigInt(0),
    },
    {
      id: "viral-tweet",
      question: "@VitalikButerin Tweet Engagement",
      category: "viral",
      topic: "Viral Tweet",
      createdAt: now,
      closesAt: now + DEMO_DURATION_MS,
      status: "open",
      baseline: 2500,
      threshold: 10000,
      thresholdType: "absolute",
      upParticipants: [],
      upBets: [],
      downParticipants: [],
      downBets: [],
      upPool: BigInt(0),
      downPool: BigInt(0),
      totalPot: BigInt(0),
    },
  ];
}

export const MARKETS = createMarkets();

export function getMarketById(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}
