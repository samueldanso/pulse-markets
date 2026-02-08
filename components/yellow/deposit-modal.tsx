"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
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

const CUSTODY_DEPOSIT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "account", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

type DepositStep =
  | "idle"
  | "switching"
  | "approving"
  | "depositing"
  | "registering"
  | "faucet"
  | "channel"
  | "done";

interface NetworkConfig {
  network: string;
  chainId: number;
  chainName: string;
  custodyAddress: string;
  usdcAddress: string;
}

export function DepositModal() {
  const { user, authenticated, login } = usePrivy();
  const { address: wagmiAddress, chainId: currentChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [amount, setAmount] = useState("10");
  const [isDepositing, setIsDepositing] = useState(false);
  const [step, setStep] = useState<DepositStep>("idle");
  const [open, setOpen] = useState(false);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig | null>(
    null,
  );
  const { setBalance, setChannelId } = useUserStore();

  const isMainnet = networkConfig?.network === "mainnet";
  const requiredChainId = networkConfig?.chainId;
  const isWrongChain =
    isMainnet && requiredChainId && currentChainId !== requiredChainId;

  const walletAddress =
    wagmiAddress ||
    user?.wallet?.address ||
    user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: networkConfig?.usdcAddress as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress as `0x${string}`] : undefined,
    query: {
      enabled: isMainnet && !!walletAddress && !!networkConfig && !isWrongChain,
    },
  });

  const formattedUsdcBalance =
    usdcBalance !== undefined ? formatUnits(usdcBalance, USDC_DECIMALS) : null;

  const parsedDepositAmount = Number(amount) || 0;
  const hasInsufficientBalance =
    isMainnet &&
    formattedUsdcBalance !== null &&
    parsedDepositAmount > Number(formattedUsdcBalance);

  const {
    writeContractAsync: writeApprove,
    data: approveTxHash,
    reset: resetApprove,
  } = useWriteContract();

  const {
    writeContractAsync: writeDeposit,
    data: depositTxHash,
    reset: resetDeposit,
  } = useWriteContract();

  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/yellow/config")
      .then((res) => res.json())
      .then((data) => setNetworkConfig(data))
      .catch(() => toast.error("Failed to load network config"));
  }, [open]);

  useEffect(() => {
    if (approveConfirmed && step === "approving") {
      handleCustodyDeposit();
    }
  }, [approveConfirmed]);

  useEffect(() => {
    if (depositConfirmed && step === "depositing") {
      handleServerRegistration();
    }
  }, [depositConfirmed]);

  async function handleSwitchChain(): Promise<boolean> {
    if (!requiredChainId || currentChainId === requiredChainId) return true;

    try {
      setStep("switching");
      await switchChainAsync({ chainId: requiredChainId });
      return true;
    } catch {
      toast.error(
        `Please switch to ${networkConfig?.chainName || "the correct network"}`,
      );
      setStep("idle");
      return false;
    }
  }

  async function handleDeposit() {
    if (!authenticated) {
      login();
      return;
    }

    if (!walletAddress) {
      toast.error("No wallet connected");
      return;
    }

    setIsDepositing(true);
    resetApprove();
    resetDeposit();

    if (isMainnet) {
      const switched = await handleSwitchChain();
      if (!switched) {
        setIsDepositing(false);
        return;
      }
      await handleMainnetDeposit();
    } else {
      await handleSandboxDeposit();
    }
  }

  async function handleMainnetDeposit() {
    if (!networkConfig || !walletAddress) return;

    try {
      setStep("approving");
      const parsedAmount = parseUnits(amount, USDC_DECIMALS);

      await writeApprove({
        address: networkConfig.usdcAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [networkConfig.custodyAddress as `0x${string}`, parsedAmount],
      });
    } catch {
      toast.error("USDC approval rejected");
      setIsDepositing(false);
      setStep("idle");
    }
  }

  async function handleCustodyDeposit() {
    if (!networkConfig || !walletAddress) return;

    try {
      setStep("depositing");
      const parsedAmount = parseUnits(amount, USDC_DECIMALS);

      await writeDeposit({
        address: networkConfig.custodyAddress as `0x${string}`,
        abi: CUSTODY_DEPOSIT_ABI,
        functionName: "deposit",
        args: [
          walletAddress as `0x${string}`,
          networkConfig.usdcAddress as `0x${string}`,
          parsedAmount,
        ],
      });
    } catch {
      toast.error("Custody deposit rejected");
      setIsDepositing(false);
      setStep("idle");
    }
  }

  async function handleServerRegistration() {
    if (!walletAddress) return;

    try {
      setStep("registering");
      const amountRaw = parseUnits(amount, USDC_DECIMALS).toString();

      const res = await fetch("/api/yellow/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          amount: amountRaw,
          txHash: depositTxHash,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Server registration failed");
        return;
      }

      const balanceUsdc = Number(data.balance) / 10 ** USDC_DECIMALS;
      setBalance(balanceUsdc);
      if (data.channelId) setChannelId(data.channelId);
      setStep("done");
      refetchBalance();

      toast.success(`Deposited $${amount} USDC on-chain`);
      setOpen(false);
    } catch {
      toast.error("Failed to register deposit with server");
    } finally {
      setIsDepositing(false);
      setStep("idle");
    }
  }

  async function handleSandboxDeposit() {
    setStep("faucet");

    try {
      const amountRaw = (Number(amount) * 10 ** USDC_DECIMALS).toString();

      setStep("channel");
      const res = await fetch("/api/yellow/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          amount: amountRaw,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Deposit failed");
        return;
      }

      const balanceUsdc = Number(data.balance) / 10 ** USDC_DECIMALS;
      setBalance(balanceUsdc);
      setChannelId(data.channelId);
      setStep("done");

      toast.success(`Deposited $${amount} USDC to Yellow channel`);
      setOpen(false);
    } catch {
      toast.error("Deposit failed — check connection");
    } finally {
      setIsDepositing(false);
      setStep("idle");
    }
  }

  function getButtonLabel(): string {
    if (isWrongChain) return `Switch to ${networkConfig?.chainName || "Base"}`;

    switch (step) {
      case "switching":
        return "Switching network...";
      case "approving":
        return "Approving USDC...";
      case "depositing":
        return "Depositing to custody...";
      case "registering":
        return "Registering balance...";
      case "faucet":
        return "Requesting funds...";
      case "channel":
        return "Opening channel...";
      default:
        return `Deposit $${amount} USDC`;
    }
  }

  const stepDescriptions = isMainnet
    ? [
        { num: "1", text: "Approve USDC spending for custody contract" },
        {
          num: "2",
          text: "Deposit USDC into Yellow custody contract on Base",
        },
        { num: "3", text: "Bet instantly — no gas fees per transaction" },
      ]
    : [
        {
          num: "1",
          text: "USDC deposited into Yellow custody contract on Base",
        },
        { num: "2", text: "State channel opened with ClearNode" },
        { num: "3", text: "Bet instantly — no gas fees per transaction" },
      ];

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
            {isMainnet
              ? "Deposit USDC from your wallet into the Yellow custody contract on Base. This requires two wallet signatures."
              : "Fund your Yellow state channel to start placing bets. Deposits are instant and gasless after the initial channel opening."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isMainnet && isWrongChain && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              Your wallet is on the wrong network. Please switch to{" "}
              {networkConfig?.chainName || "Base"} to deposit.
            </div>
          )}

          <div className="rounded-lg border border-pulse-black/10 bg-pulse-black/[0.02] p-4">
            <div className="mb-3 space-y-2 text-xs text-pulse-gray">
              {stepDescriptions.map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div className="flex size-5 items-center justify-center rounded-full bg-pulse-lime-100 text-[10px] font-bold text-pulse-lime-700">
                    {s.num}
                  </div>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-pulse-gray">
                Amount (USDC)
              </label>
              {isMainnet && formattedUsdcBalance !== null && (
                <span className="text-xs text-pulse-gray">
                  Wallet: {Number(formattedUsdcBalance).toFixed(2)} USDC
                </span>
              )}
            </div>
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
            {hasInsufficientBalance && (
              <p className="text-xs text-red-500">
                Insufficient USDC balance in your wallet
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleDeposit}
            disabled={
              isDepositing ||
              !amount ||
              parsedDepositAmount <= 0 ||
              hasInsufficientBalance
            }
            className="w-full bg-pulse-lime-400 font-bold text-pulse-black hover:bg-pulse-lime-500"
          >
            {getButtonLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
