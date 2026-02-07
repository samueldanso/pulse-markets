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

export function WithdrawModal() {
  const { authenticated, login } = usePrivy();
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [open, setOpen] = useState(false);
  const { balance, setBalance, channelId, setChannelId } = useUserStore();

  async function handleWithdraw() {
    if (!authenticated) {
      login();
      return;
    }

    const withdrawAmount = Number(amount);
    if (withdrawAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsWithdrawing(true);
    try {
      // For demo: simulate withdrawal by closing the Yellow state channel
      // In production, this calls closeChannel() + withdrawFromCustody()
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newBalance = balance - withdrawAmount;
      setBalance(newBalance);
      if (newBalance <= 0) {
        setChannelId(null);
      }

      toast.success(`Withdrew $${withdrawAmount} USDC to your wallet`);
      setOpen(false);
      setAmount("");
    } catch {
      toast.error("Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={!channelId || balance <= 0}
          className="border-pulse-black/20 text-pulse-black"
        >
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
          <DialogDescription>
            Close your state channel and withdraw USDC back to your wallet on
            Base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-pulse-black/10 bg-pulse-black/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-pulse-gray">Channel Balance</span>
              <span className="font-mono text-sm font-bold text-pulse-black">
                ${balance.toFixed(2)} USDC
              </span>
            </div>
            <div className="space-y-2 text-xs text-pulse-gray">
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  1
                </div>
                <span>State channel closed cooperatively</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  2
                </div>
                <span>USDC withdrawn from Yellow custody on Base</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  3
                </div>
                <span>Funds returned to your connected wallet</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-pulse-gray">
              Amount (USDC)
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAmount(balance.toString())}
                className="rounded-lg border border-pulse-black/10 px-3 py-2 text-sm font-medium text-pulse-gray hover:border-pulse-black/20"
              >
                Max
              </button>
            </div>
            <Input
              type="number"
              placeholder="Amount to withdraw"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={balance}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleWithdraw}
            disabled={
              isWithdrawing || !amount || Number(amount) <= 0 || Number(amount) > balance
            }
            className="w-full bg-pulse-black font-bold text-white hover:bg-pulse-black/90"
          >
            {isWithdrawing
              ? "Closing Channel..."
              : `Withdraw $${amount || "0"} USDC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
