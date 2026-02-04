"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BetSide } from "@/types";

interface BetInterfaceProps {
	marketId: string;
	status: string;
	closesAt: number;
	onBetPlaced: () => void;
}

const BET_AMOUNTS = ["1", "5", "10", "25"];

export function BetInterface({
	marketId,
	status,
	closesAt,
	onBetPlaced,
}: BetInterfaceProps) {
	const { user, authenticated, login } = usePrivy();
	const [amount, setAmount] = useState("5");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isExpired = Date.now() > closesAt;
	const canBet = status === "open" && !isExpired && authenticated;

	async function handleBet(side: BetSide) {
		if (!authenticated) {
			login();
			return;
		}

		const userAddress =
			user?.wallet?.address || user?.linkedAccounts?.find(
				(a) => a.type === "wallet",
			)?.address;

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
					side,
					amount: amountUsdc,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Failed to place bet");
				return;
			}

			toast.success(`${side} bet placed: $${amount} USDC`);
			onBetPlaced();
		} catch {
			toast.error("Network error");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (status === "closed") {
		return (
			<div className="rounded-xl border border-pulse-black/5 bg-pulse-black/[0.02] p-6 text-center">
				<p className="text-sm font-medium text-pulse-gray">
					This market has been settled.
				</p>
			</div>
		);
	}

	if (isExpired) {
		return (
			<div className="rounded-xl border border-pulse-black/5 bg-pulse-black/[0.02] p-6 text-center">
				<p className="text-sm font-medium text-pulse-gray">
					Market expired. Waiting for settlement.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 rounded-xl border border-pulse-black/5 bg-white p-6">
			<h3 className="font-semibold text-pulse-black">Place Your Bet</h3>

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
					className="mt-1"
				/>
			</div>

			{/* UP / DOWN buttons */}
			<div className="grid grid-cols-2 gap-3">
				<Button
					size="lg"
					disabled={!canBet || isSubmitting}
					onClick={() => handleBet("UP")}
					className="bg-pulse-lime-400 font-bold text-pulse-black hover:bg-pulse-lime-500"
				>
					{isSubmitting ? "..." : "UP ↑"}
				</Button>
				<Button
					size="lg"
					variant="outline"
					disabled={!canBet || isSubmitting}
					onClick={() => handleBet("DOWN")}
					className="border-pulse-black/20 font-bold text-pulse-black hover:bg-pulse-black/5"
				>
					{isSubmitting ? "..." : "DOWN ↓"}
				</Button>
			</div>

			{!authenticated && (
				<p className="text-center text-xs text-pulse-gray">
					Connect your wallet to place a bet
				</p>
			)}
		</div>
	);
}
