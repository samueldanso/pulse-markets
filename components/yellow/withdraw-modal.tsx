"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
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

const USDC_DECIMALS = 6;

const CUSTODY_WITHDRAW_ABI = [
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

type WithdrawStep = "idle" | "switching" | "withdrawing" | "confirming";

interface NetworkConfig {
  network: string;
  chainId: number;
  chainName: string;
  custodyAddress: string;
  usdcAddress: string;
}

export function WithdrawModal() {
  const { user, authenticated, login } = usePrivy();
  const { address: wagmiAddress, chainId: currentChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<WithdrawStep>("idle");
  const [open, setOpen] = useState(false);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(
    null,
  );
  const { balance, setBalance, setChannelId } = useUserStore();

  const isMainnet = networkConfig?.network === "mainnet";

  const walletAddress =
    wagmiAddress ||
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;

  const {
    writeContractAsync,
    data: withdrawTxHash,
    reset: resetWrite,
  } = useWriteContract();

  const { isSuccess: withdrawConfirmed } = useWaitForTransactionReceipt({
    hash: withdrawTxHash,
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/yellow/config")
      .then((res) => res.json())
      .then((data) => setNetworkConfig(data))
      .catch(() => toast.error("Failed to load network config"));
  }, [open]);

  useEffect(() => {
    if (withdrawConfirmed && step === "withdrawing") {
      handleServerDeduction();
    }
  }, [withdrawConfirmed]);

  async function handleWithdraw() {
    if (!authenticated) {
      login();
      return;
    }

    if (!walletAddress) {
      toast.error("No wallet connected");
      return;
    }

    const withdrawAmount = Number(amount);
    if (withdrawAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    resetWrite();

    if (isMainnet) {
      await handleMainnetWithdraw();
    } else {
      await handleSandboxWithdraw();
    }
  }

  async function handleMainnetWithdraw() {
    if (!networkConfig || !walletAddress) return;

    const requiredChainId = networkConfig.chainId;
    if (currentChainId !== requiredChainId) {
      try {
        setStep("switching");
        await switchChainAsync({ chainId: requiredChainId });
      } catch {
        toast.error(`Please switch to ${networkConfig.chainName}`);
        setStep("idle");
        return;
      }
    }

    try {
      setStep("withdrawing");
      const parsedAmount = parseUnits(amount, USDC_DECIMALS);

      await writeContractAsync({
        address: networkConfig.custodyAddress as `0x${string}`,
        abi: CUSTODY_WITHDRAW_ABI,
        functionName: "withdraw",
        args: [networkConfig.usdcAddress as `0x${string}`, parsedAmount],
      });
    } catch {
      toast.error("Withdrawal rejected");
      setStep("idle");
    }
  }

  async function handleServerDeduction() {
    if (!walletAddress) return;

    try {
      setStep("confirming");
      const amountRaw = parseUnits(amount, USDC_DECIMALS).toString();

      const res = await fetch("/api/yellow/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          amount: amountRaw,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Server update failed");
        return;
      }

      const balanceUsdc = Number(data.balance) / 10 ** USDC_DECIMALS;
      setBalance(balanceUsdc);
      if (balanceUsdc <= 0) setChannelId(null);

      toast.success(`Withdrew $${amount} USDC to your wallet`);
      setOpen(false);
      setAmount("");
    } catch {
      toast.error("Failed to update server balance");
    } finally {
      setStep("idle");
    }
  }

  async function handleSandboxWithdraw() {
    if (!walletAddress) return;

    setStep("withdrawing");
    try {
      const amountRaw = (Number(amount) * 10 ** USDC_DECIMALS).toString();

      const res = await fetch("/api/yellow/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          amount: amountRaw,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Withdrawal failed");
        return;
      }

      const balanceUsdc = Number(data.balance) / 10 ** USDC_DECIMALS;
      setBalance(balanceUsdc);
      if (balanceUsdc <= 0) setChannelId(null);

      toast.success(`Withdrew $${amount} USDC to your wallet`);
      setOpen(false);
      setAmount("");
    } catch {
      toast.error("Withdrawal failed — check connection");
    } finally {
      setStep("idle");
    }
  }

  function getButtonLabel(): string {
    switch (step) {
      case "switching":
        return "Switching network...";
      case "withdrawing":
        return isMainnet
          ? "Withdrawing from custody..."
          : "Closing channel...";
      case "confirming":
        return "Confirming...";
      default:
        return `Withdraw $${amount || "0"} USDC`;
    }
  }

  const isWithdrawing = step !== "idle";

  const stepDescriptions = isMainnet
    ? [
        { num: "1", text: "Withdraw USDC from Yellow custody contract" },
        { num: "2", text: "USDC returned to your wallet on Base" },
      ]
    : [
        { num: "1", text: "State channel closed cooperatively" },
        { num: "2", text: "USDC withdrawn from Yellow custody on Base" },
        { num: "3", text: "Funds returned to your connected wallet" },
      ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={balance <= 0}
          className="border-pulse-black/20 text-pulse-black"
        >
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
          <DialogDescription>
            {isMainnet
              ? "Withdraw USDC from the Yellow custody contract back to your wallet on Base."
              : "Close your state channel and withdraw USDC back to your wallet on Base."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-pulse-black/10 bg-pulse-black/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-pulse-gray">
                {isMainnet ? "Custody Balance" : "Channel Balance"}
              </span>
              <span className="font-mono text-sm font-bold text-pulse-black">
                ${balance.toFixed(2)} USDC
              </span>
            </div>
            <div className="space-y-2 text-xs text-pulse-gray">
              {stepDescriptions.map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                    {s.num}
                  </div>
                  <span>{s.text}</span>
                </div>
              ))}
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
              isWithdrawing ||
              !amount ||
              Number(amount) <= 0 ||
              Number(amount) > balance
            }
            className="w-full bg-pulse-black font-bold text-white hover:bg-pulse-black/90"
          >
            {getButtonLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
