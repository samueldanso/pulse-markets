"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { ConnectButton } from "@/components/wallet/connect-button";
import { BetInterface } from "@/components/markets/bet-interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

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

export default function MarketDetailPage() {
	const params = useParams();
	const marketId = params.id as string;

	const [market, setMarket] = useState<MarketDetail | null>(null);
	const [pools, setPools] = useState<PoolStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSettling, setIsSettling] = useState(false);

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

	const countdown = useCountdown(market?.closesAt ?? 0);
	const isExpired = countdown === "Expired";

	async function handleSettle() {
		setIsSettling(true);
		try {
			const res = await fetch(`/api/settle/${marketId}`, { method: "POST" });
			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Settlement failed");
				return;
			}

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
			<div className="min-h-screen bg-pulse-bg">
				<div className="mx-auto max-w-3xl space-y-6 px-6 py-20">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-64 rounded-xl" />
					<Skeleton className="h-48 rounded-xl" />
				</div>
			</div>
		);
	}

	if (!market) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-pulse-bg">
				<p className="text-pulse-gray">Market not found</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-pulse-bg">
			{/* Navigation */}
			<nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-6">
				<Link href="/markets" className="flex items-center gap-2">
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

			<main className="mx-auto max-w-3xl px-6 py-4">
				{/* Back link */}
				<Link
					href="/markets"
					className="mb-6 inline-flex items-center text-sm text-pulse-gray hover:text-pulse-black"
				>
					← Back to Markets
				</Link>

				{/* Market header */}
				<div className="mb-6 flex items-start justify-between">
					<div>
						<div className="mb-2 flex items-center gap-2">
							<Badge
								variant="outline"
								className="text-[10px] uppercase tracking-wider"
							>
								{market.category}
							</Badge>
							{market.status === "closed" && (
								<Badge className="bg-pulse-black text-white">Settled</Badge>
							)}
						</div>
						<h1 className="text-2xl font-bold text-pulse-black">
							{market.question}
						</h1>
						<p className="mt-1 text-sm text-pulse-gray">
							Topic: {market.topic} · Baseline: {market.baseline}
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-pulse-gray">Time Remaining</p>
						<p
							className={`font-mono text-xl font-bold ${isExpired ? "text-red-500" : "text-pulse-black"}`}
						>
							{countdown}
						</p>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-5">
					{/* Pool stats (3 cols) */}
					<div className="space-y-4 md:col-span-3">
						<Card className="border-pulse-black/5">
							<CardContent className="space-y-4 pt-6">
								<h3 className="font-semibold text-pulse-black">Pool Stats</h3>

								{/* Pool bar */}
								<div className="space-y-1">
									<div className="flex h-4 overflow-hidden rounded-full bg-pulse-black/5">
										<div
											className="flex items-center justify-center bg-pulse-lime-400 text-[10px] font-bold text-pulse-black transition-all"
											style={{
												width: `${pools?.upPercentage ?? 50}%`,
											}}
										>
											{(pools?.upPercentage ?? 50) > 15 &&
												`${(pools?.upPercentage ?? 50).toFixed(0)}%`}
										</div>
										<div
											className="flex items-center justify-center bg-pulse-black/20 text-[10px] font-bold text-white transition-all"
											style={{
												width: `${pools?.downPercentage ?? 50}%`,
											}}
										>
											{(pools?.downPercentage ?? 50) > 15 &&
												`${(pools?.downPercentage ?? 50).toFixed(0)}%`}
										</div>
									</div>
								</div>

								{/* Stats grid */}
								<div className="grid grid-cols-2 gap-4">
									<div className="rounded-lg bg-pulse-lime-50 p-3">
										<p className="text-xs font-medium text-pulse-lime-700">
											UP Pool
										</p>
										<p className="text-lg font-bold text-pulse-black">
											{formatUsdc(pools?.upPool ?? "0")}
										</p>
										<p className="text-xs text-pulse-gray">
											{pools?.upParticipants ?? 0} participants
										</p>
									</div>
									<div className="rounded-lg bg-pulse-black/[0.03] p-3">
										<p className="text-xs font-medium text-pulse-gray">
											DOWN Pool
										</p>
										<p className="text-lg font-bold text-pulse-black">
											{formatUsdc(pools?.downPool ?? "0")}
										</p>
										<p className="text-xs text-pulse-gray">
											{pools?.downParticipants ?? 0} participants
										</p>
									</div>
								</div>

								<div className="border-t border-pulse-black/5 pt-3">
									<div className="flex items-center justify-between">
										<span className="text-sm text-pulse-gray">Total Pot</span>
										<span className="font-mono text-lg font-bold text-pulse-black">
											{formatUsdc(pools?.totalPot ?? "0")}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Settlement section */}
						{isExpired && market.status !== "closed" && (
							<Card className="border-orange-200 bg-orange-50">
								<CardContent className="pt-6">
									<p className="mb-3 text-sm text-orange-800">
										This market has expired. Click below to trigger AI
										settlement.
									</p>
									<Button
										onClick={handleSettle}
										disabled={isSettling}
										className="w-full bg-pulse-black font-bold text-white hover:bg-pulse-black/90"
									>
										{isSettling ? "Settling..." : "Settle Market"}
									</Button>
								</CardContent>
							</Card>
						)}

						{/* AI Reasoning */}
						{market.status === "closed" && market.aiReasoning && (
							<Card className="border-pulse-lime-200 bg-pulse-lime-50">
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
								</CardContent>
							</Card>
						)}
					</div>

					{/* Bet interface (2 cols) */}
					<div className="md:col-span-2">
						<BetInterface
							marketId={market.id}
							status={market.status}
							closesAt={market.closesAt}
							onBetPlaced={fetchData}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
