"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/user-store";
import type { BetSide } from "@/types";

interface BetInterfaceProps {
  marketId: string;
  status: string;
  closesAt: number;
  onBetPlaced: () => void;
  preSelectedSide?: "UP" | "DOWN";
}

const BET_AMOUNTS = ["1", "5", "10", "25"];

export function BetInterface({
  marketId,
  status,
  closesAt,
  onBetPlaced,
  preSelectedSide,
}: BetInterfaceProps) {
  const { user, authenticated, login } = usePrivy();
  const { addPosition } = useUserStore();
  const [amount, setAmount] = useState("5");
  const [selectedSide, setSelectedSide] = useState<BetSide | null>(
    preSelectedSide ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExpired = Date.now() > closesAt;
  const canBet = status === "open" && !isExpired && authenticated;

  async function handleBet() {
    if (!selectedSide) {
      toast.error("Select UP or DOWN first");
      return;
    }

    if (!authenticated) {
      login();
      return;
    }

    const userAddress =
      user?.wallet?.address ||
      user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;

    if (!userAddress) {
      toast.error("No wallet connected");
      return;
    }

    const amountUsdc = (Number(amount) * 1_000_000).toString();

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/markets/${marketId}/bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress,
          side: selectedSide,
          amount: amountUsdc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to place bet");
        return;
      }

      addPosition({
        id: `${marketId}-${Date.now()}`,
        marketId,
        side: selectedSide,
        amount: Number(amount),
        timestamp: Date.now(),
        settled: false,
      });
      toast.success(`${selectedSide} bet placed: $${amount} USDC`);
      onBetPlaced();
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "closed") {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-medium text-pulse-gray">
          This market has been settled.
        </p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-medium text-pulse-gray">
          Market expired. Waiting for settlement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6">
      <h3 className="font-semibold text-pulse-black">Place Your Bet</h3>

      {/* Side selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSelectedSide("UP")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
            selectedSide === "UP"
              ? "bg-pulse-up text-white shadow-lg shadow-pulse-up/25"
              : "bg-pulse-up/15 text-pulse-up hover:bg-pulse-up/25"
          }`}
        >
          Up ↑
        </button>
        <button
          type="button"
          onClick={() => setSelectedSide("DOWN")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
            selectedSide === "DOWN"
              ? "bg-pulse-down text-white shadow-lg shadow-pulse-down/25"
              : "bg-pulse-down/15 text-pulse-down hover:bg-pulse-down/25"
          }`}
        >
          Down ↓
        </button>
      </div>

      {/* Amount selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-pulse-gray">
          Amount (USDC)
        </label>
        <div className="flex gap-2">
          {BET_AMOUNTS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAmount(a)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                amount === a
                  ? "border-pulse-up/50 bg-pulse-up/10 text-pulse-black"
                  : "border-white/10 text-pulse-gray hover:border-white/20"
              }`}
            >
              ${a}
            </button>
          ))}
        </div>
        <Input
          type="number"
          placeholder="Custom amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Place bet button */}
      <Button
        size="lg"
        disabled={!canBet || isSubmitting || !selectedSide}
        onClick={handleBet}
        className={`w-full font-bold text-white ${
          selectedSide === "DOWN"
            ? "bg-pulse-down hover:bg-pulse-down/90"
            : "bg-pulse-up hover:bg-pulse-up/90"
        }`}
      >
        {isSubmitting
          ? "Placing bet..."
          : selectedSide
            ? `Bet ${selectedSide} · $${amount}`
            : "Select UP or DOWN"}
      </Button>

      {!authenticated && (
        <p className="text-center text-xs text-pulse-gray">
          Connect your wallet to place a bet
        </p>
      )}
    </div>
  );
}
