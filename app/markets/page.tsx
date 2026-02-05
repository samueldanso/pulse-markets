"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarketCard } from "@/components/markets/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectButton } from "@/components/wallet/connect-button";

interface MarketData {
  id: string;
  question: string;
  category: string;
  topic: string;
  createdAt: number;
  closesAt: number;
  status: string;
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
    <div className="min-h-screen bg-pulse-bg">
      {/* Navigation */}
      <nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 8C2 8 4 4 6 4C8 4 8 8 10 8C12 8 12 2 14 2C16 2 16 10 18 10C20 10 22 6 22 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12C2 12 4 8 6 8C8 8 8 12 10 12C12 12 12 6 14 6C16 6 16 14 18 14C20 14 22 10 22 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 16C2 16 4 12 6 12C8 12 8 16 10 16C12 16 12 10 14 10C16 10 16 18 18 18C20 18 22 14 22 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-pulse-black">
            Pulse
          </span>
        </Link>
        <ConnectButton />
      </nav>

      {/* Content */}
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
    </div>
  );
}
