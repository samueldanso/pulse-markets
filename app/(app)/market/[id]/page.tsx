"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BetInterface } from "@/components/markets/bet-interface";
import { SparklineChart } from "@/components/markets/sparkline-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateSparklineData,
  getChangePercent,
  getLatestValue,
} from "@/lib/sparkline";

interface MarketDetail {
  id: string;
  question: string;
  category: string;
  topic: string;
  createdAt: number;
  closesAt: number;
  status: string;
  baseline: number;
  threshold: number;
  thresholdType: string;
  upPool: string;
  downPool: string;
  totalPot: string;
  upParticipants: string[];
  downParticipants: string[];
  upBets: string[];
  downBets: string[];
  result?: string;
  aiReasoning?: string;
  resolvedAt?: number;
}

interface AgentProof {
  agentId: string;
  agentRegistry: string;
  operatorAddress: string;
  registryUrl: string;
  reputation: {
    tag1: string;
    tag2: string;
    value: number;
  };
}

interface SettlementData {
  winner: string;
  reasoning: string;
  confidence: number;
  dataSource: string;
  agent: AgentProof | null;
}

interface PoolStats {
  upPool: string;
  downPool: string;
  totalPot: string;
  upParticipants: number;
  downParticipants: number;
  upPercentage: number;
  downPercentage: number;
}

function formatUsdc(amount: string): string {
  const num = Number(amount) / 1_000_000;
  if (num === 0) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function useCountdown(closesAt: number): string {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const diff = closesAt - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  return timeLeft;
}

const TIME_PERIODS = ["1H", "4H", "1D", "1W"];

export default function MarketDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const marketId = params.id as string;
  const sideParam = searchParams.get("side");
  const preSelectedSide = sideParam === "UP" || sideParam === "DOWN" ? sideParam : undefined;

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [pools, setPools] = useState<PoolStats | null>(null);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettling, setIsSettling] = useState(false);
  const [activePeriod, setActivePeriod] = useState("1W");

  const fetchData = useCallback(async () => {
    try {
      const [marketRes, poolsRes] = await Promise.all([
        fetch(`/api/markets/${marketId}`),
        fetch(`/api/markets/${marketId}/pools`),
      ]);
      const marketData = await marketRes.json();
      const poolsData = await poolsRes.json();
      setMarket(marketData.market || null);
      setPools(poolsData);
    } catch (error) {
      console.error("Failed to fetch market:", error);
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sparklineData = useMemo(
    () => generateSparklineData(market?.topic ?? "", market?.baseline ?? 0, 60),
    [market?.topic, market?.baseline],
  );

  const changePercent = useMemo(
    () => getChangePercent(sparklineData),
    [sparklineData],
  );

  const latestValue = useMemo(
    () => getLatestValue(sparklineData),
    [sparklineData],
  );

  const countdown = useCountdown(market?.closesAt ?? 0);
  const isExpired = countdown === "Expired";

  const total = Number(pools?.upPool ?? 0) + Number(pools?.downPool ?? 0);
  const isPositive = total > 0
    ? Number(pools?.upPool ?? 0) > Number(pools?.downPool ?? 0)
    : changePercent > 0;

  async function handleSettle() {
    setIsSettling(true);
    try {
      const res = await fetch(`/api/settle/${marketId}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Settlement failed");
        return;
      }

      setSettlement({
        winner: data.winner,
        reasoning: data.reasoning,
        confidence: data.confidence,
        dataSource: data.dataSource,
        agent: data.agent,
      });
      toast.success(`${data.winner} wins!`);
      fetchData();
    } catch {
      toast.error("Settlement failed");
    } finally {
      setIsSettling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-20">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-pulse-gray">Market not found</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-4">
      {/* Back link */}
      <Link
        href="/markets"
        className="mb-6 inline-flex items-center text-sm text-pulse-gray hover:text-pulse-black"
      >
        ← Back to Markets
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Chart + Pool Stats */}
        <div className="space-y-4 lg:col-span-2">
          {/* Chart card */}
          <Card className="overflow-hidden border-white/[0.08] bg-white/[0.03] dark:border-white/[0.08] dark:bg-white/[0.03]">
            <CardContent className="p-0">
              {/* Header inside chart card */}
              <div className="flex items-start justify-between p-5 pb-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider"
                    >
                      {market.category}
                    </Badge>
                    {market.status === "closed" && (
                      <Badge className="bg-foreground text-background">
                        Settled
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-pulse-black">
                    {market.question}
                  </h1>
                  <p className="mt-0.5 text-xs text-pulse-gray">
                    Attention Index · {market.topic}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-pulse-black">
                    {latestValue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    className={`text-sm font-semibold ${isPositive ? "text-pulse-up" : "text-pulse-down"}`}
                  >
                    {changePercent >= 0 ? "+" : ""}
                    {changePercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Time period selector */}
              <div className="flex gap-1 px-5 pb-3">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setActivePeriod(period)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      activePeriod === period
                        ? "bg-pulse-black/10 text-pulse-black dark:bg-white/10"
                        : "text-pulse-gray hover:text-pulse-black"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="px-2 pb-2">
                <SparklineChart
                  data={sparklineData}
                  isPositive={isPositive}
                  variant="detail"
                  height={320}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compact pool stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-pulse-up">UP Pool</p>
              <p className="mt-1 font-mono text-lg font-bold text-pulse-black">
                {formatUsdc(pools?.upPool ?? "0")}
              </p>
              <p className="text-xs text-pulse-gray">
                {pools?.upParticipants ?? 0} bets · {(pools?.upPercentage ?? 50).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-pulse-down">DOWN Pool</p>
              <p className="mt-1 font-mono text-lg font-bold text-pulse-black">
                {formatUsdc(pools?.downPool ?? "0")}
              </p>
              <p className="text-xs text-pulse-gray">
                {pools?.downParticipants ?? 0} bets · {(pools?.downPercentage ?? 50).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-pulse-gray">Total Pot</p>
              <p className="mt-1 font-mono text-lg font-bold text-pulse-black">
                {formatUsdc(pools?.totalPot ?? "0")}
              </p>
              <p className="text-xs text-pulse-gray">
                {countdown === "Expired" ? (
                  <span className="text-pulse-down">Expired</span>
                ) : (
                  <span>{countdown} left</span>
                )}
              </p>
            </div>
          </div>

          {/* Settlement section */}
          {isExpired && market.status !== "closed" && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <CardContent className="pt-6">
                <p className="mb-3 text-sm text-orange-800 dark:text-orange-300">
                  This market has expired. Click below to trigger AI settlement.
                </p>
                <Button
                  onClick={handleSettle}
                  disabled={isSettling}
                  className="w-full bg-foreground font-bold text-background hover:opacity-90"
                >
                  {isSettling ? "Settling..." : "Settle Market"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Reasoning */}
          {market.status === "closed" && market.aiReasoning && (
            <Card className="border-pulse-lime-200 bg-pulse-lime-50 dark:border-pulse-lime-800 dark:bg-pulse-lime-900/20">
              <CardContent className="pt-6">
                <h3 className="mb-2 font-semibold text-pulse-black">
                  AI Settlement
                </h3>
                <Badge className="mb-3 bg-pulse-lime-400 text-pulse-black">
                  {market.result} Won
                </Badge>
                <p className="text-sm leading-relaxed text-pulse-gray">
                  {market.aiReasoning}
                </p>
                {settlement?.confidence !== undefined && (
                  <p className="mt-2 text-xs text-pulse-gray">
                    Confidence: {(settlement.confidence * 100).toFixed(0)}% ·
                    Source: {settlement.dataSource}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ERC-8004 Agent Identity */}
          {market.status === "closed" && settlement?.agent && (
            <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-indigo-600"
                      />
                      <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-indigo-600"
                      />
                      <path
                        d="M2 12L12 17L22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-indigo-600"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-pulse-black">
                    Settled by ERC-8004 Agent
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-pulse-gray">Agent ID</span>
                    <span className="font-mono font-medium text-pulse-black">
                      #{settlement.agent.agentId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pulse-gray">Operator</span>
                    <span className="font-mono text-xs text-pulse-black">
                      {settlement.agent.operatorAddress.slice(0, 6)}...
                      {settlement.agent.operatorAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pulse-gray">Registry</span>
                    <span className="text-xs text-pulse-black">
                      {settlement.agent.agentRegistry}
                    </span>
                  </div>
                  {settlement.agent.reputation.value > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-pulse-gray">Reputation</span>
                      <span className="font-medium text-pulse-black">
                        {settlement.agent.reputation.value}
                      </span>
                    </div>
                  )}
                </div>
                <a
                  href={settlement.agent.registryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  View on 8004scan →
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Bet interface */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <BetInterface
              marketId={market.id}
              status={market.status}
              closesAt={market.closesAt}
              onBetPlaced={fetchData}
              preSelectedSide={preSelectedSide}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
