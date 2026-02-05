"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MarketCardProps {
  id: string;
  question: string;
  category: string;
  topic: string;
  closesAt: number;
  status: string;
  upPool: string;
  downPool: string;
  totalPot: string;
  upParticipants: number;
  downParticipants: number;
  result?: string;
}

function formatUsdc(amount: string): string {
  const num = Number(amount) / 1_000_000;
  if (num === 0) return "$0";
  if (num < 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(0)}`;
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

export function MarketCard(props: MarketCardProps) {
  const countdown = useCountdown(props.closesAt);
  const total = Number(props.upPool) + Number(props.downPool);
  const upPct = total > 0 ? (Number(props.upPool) / total) * 100 : 50;
  const downPct = total > 0 ? 100 - upPct : 50;
  const isExpired = countdown === "Expired";
  const isClosed = props.status === "closed";

  return (
    <Link href={`/market/${props.id}`}>
      <Card className="group cursor-pointer border-pulse-black/5 bg-white transition-all hover:border-pulse-lime-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Badge
            variant="outline"
            className="text-[10px] font-medium uppercase tracking-wider text-pulse-gray"
          >
            {props.category}
          </Badge>
          {isClosed ? (
            <Badge className="bg-pulse-black text-white">
              {props.result === "UP" ? "UP Won" : "DOWN Won"}
            </Badge>
          ) : (
            <span
              className={`font-mono text-sm font-semibold ${isExpired ? "text-red-500" : "text-pulse-gray"}`}
            >
              {countdown}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-pulse-black group-hover:text-pulse-lime-700">
              {props.question}
            </h3>
            <p className="mt-1 text-sm text-pulse-gray">
              Will {props.topic} attention go UP or DOWN?
            </p>
          </div>

          {/* Pool bar */}
          <div className="space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-pulse-black/5">
              <div
                className="bg-pulse-lime-400 transition-all"
                style={{ width: `${upPct}%` }}
              />
              <div
                className="bg-pulse-black/20 transition-all"
                style={{ width: `${downPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-pulse-lime-700">
                UP {upPct.toFixed(0)}% · {props.upParticipants}
              </span>
              <span className="font-medium text-pulse-gray">
                DOWN {downPct.toFixed(0)}% · {props.downParticipants}
              </span>
            </div>
          </div>

          {/* Total pot */}
          <div className="flex items-center justify-between border-t border-pulse-black/5 pt-3">
            <span className="text-xs text-pulse-gray">Total Pool</span>
            <span className="font-mono text-sm font-bold text-pulse-black">
              {formatUsdc(props.totalPot)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
