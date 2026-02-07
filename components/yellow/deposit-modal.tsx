"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/stores/user-store";

export function DepositModal() {
  const { authenticated, login } = usePrivy();
  const [amount, setAmount] = useState("10");
  const [isDepositing, setIsDepositing] = useState(false);
  const [open, setOpen] = useState(false);
  const { balance, setBalance, setChannelId } = useUserStore();

  async function handleDeposit() {
    if (!authenticated) {
      login();
      return;
    }

    setIsDepositing(true);
    try {
      // For demo: simulate deposit by opening a Yellow state channel
      // In production, this calls depositToCustody() from lib/yellow/deposit.ts
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const depositAmount = Number(amount);
      setBalance(balance + depositAmount);
      setChannelId("demo-channel-" + Date.now().toString(36));

      toast.success(`Deposited $${amount} USDC to Yellow channel`);
      setOpen(false);
    } catch {
      toast.error("Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-pulse-lime-400 text-pulse-black hover:bg-pulse-lime-500"
        >
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
          <DialogDescription>
            Fund your Yellow state channel to start placing bets. Deposits are
            instant and gasless after the initial channel opening.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-pulse-black/10 bg-pulse-black/[0.02] p-4">
            <div className="mb-3 space-y-2 text-xs text-pulse-gray">
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-pulse-lime-100 text-[10px] font-bold text-pulse-lime-700">
                  1
                </div>
                <span>USDC deposited into Yellow custody contract on Base</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-pulse-lime-100 text-[10px] font-bold text-pulse-lime-700">
                  2
                </div>
                <span>State channel opened with ClearNode</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-pulse-lime-100 text-[10px] font-bold text-pulse-lime-700">
                  3
                </div>
                <span>Bet instantly — no gas fees per transaction</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-pulse-gray">
              Amount (USDC)
            </label>
            <div className="flex gap-2">
              {["10", "50", "100"].map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    amount === a
                      ? "border-pulse-lime-300 bg-pulse-lime-50 text-pulse-black"
                      : "border-pulse-black/10 text-pulse-gray hover:border-pulse-black/20"
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
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleDeposit}
            disabled={isDepositing || !amount || Number(amount) <= 0}
            className="w-full bg-pulse-lime-400 font-bold text-pulse-black hover:bg-pulse-lime-500"
          >
            {isDepositing ? "Opening Channel..." : `Deposit $${amount} USDC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
