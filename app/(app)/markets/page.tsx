"use client";

import { useEffect, useState } from "react";
import { MarketCard } from "@/components/markets/market-card";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketData {
  id: string;
  question: string;
  category: string;
  topic: string;
  createdAt: number;
  closesAt: number;
  status: string;
  baseline: number;
  upPool: string;
  downPool: string;
  totalPot: string;
  upParticipants: number;
  downParticipants: number;
  result?: string;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const res = await fetch("/api/markets");
        const data = await res.json();
        setMarkets(data.markets || []);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pulse-black">
          Attention Markets
        </h1>
        <p className="mt-2 text-pulse-gray">
          Bet on attention, sentiment, and narratives. Winners split the pot.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <MarketCard key={market.id} {...market} />
          ))}
        </div>
      )}
    </main>
  );
}
