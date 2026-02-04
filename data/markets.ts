import type { Market } from "@/types";

export const DEMO_DURATION_MS = 15 * 60 * 1000;

export function createMarkets(): Market[] {
  const now = Date.now();

  return [
    {
      id: "btc-sentiment",
      question: "Will BTC sentiment score increase in the next 15 minutes?",
      category: "sentiment",
      topic: "BTC",
      createdAt: now,
      closesAt: now + DEMO_DURATION_MS,
      status: "open",
      baseline: 65,
      threshold: 5,
      thresholdType: "percentage",
      yesPool: 0,
      noPool: 0,
    },
    {
      id: "ai-agents-narrative",
      question: 'Will "AI Agents" mentions increase 25% in 15 minutes?',
      category: "narrative",
      topic: "AI Agents",
      createdAt: now,
      closesAt: now + DEMO_DURATION_MS,
      status: "open",
      baseline: 12500,
      threshold: 25,
      thresholdType: "percentage",
      yesPool: 0,
      noPool: 0,
    },
    {
      id: "viral-tweet",
      question:
        "Will @VitalikButerin's latest tweet hit 10k likes by market close?",
      category: "viral",
      topic: "Viral Tweet",
      createdAt: now,
      closesAt: now + DEMO_DURATION_MS,
      status: "open",
      baseline: 2500,
      threshold: 10000,
      thresholdType: "absolute",
      yesPool: 0,
      noPool: 0,
    },
  ];
}

export const MARKETS = createMarkets();

export function getMarketById(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}
