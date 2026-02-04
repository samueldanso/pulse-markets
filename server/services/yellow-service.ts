/**
 * Yellow Service Singleton
 * Server-side Yellow Network connection manager.
 * Connects to ClearNode with house wallet, manages market sessions.
 */

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

import { YellowClient } from "@/lib/yellow/client";
import { CLEARNODE_SANDBOX_URL } from "@/lib/yellow/constants";
import {
	addBetToMarket,
	calculateProportionalDistribution,
	createMarketSession,
	settleMarketSession,
} from "@/lib/yellow/sessions";
import type {
	MarketSession,
	PoolBetParams,
	SettlementOutcome,
} from "@/lib/yellow/types";

import type { BetSide, Market } from "@/types";
import { getMarketById, MARKETS } from "@/data/markets";

class YellowService {
	private client: YellowClient | null = null;
	private sessions = new Map<string, MarketSession>();
	private initialized = false;
	private initializing: Promise<void> | null = null;

	async initialize(): Promise<void> {
		if (this.initialized) return;
		if (this.initializing) return this.initializing;

		this.initializing = this.doInitialize();
		return this.initializing;
	}

	private async doInitialize(): Promise<void> {
		const privateKey = process.env.HOUSE_WALLET_PRIVATE_KEY;
		if (!privateKey) {
			throw new Error("HOUSE_WALLET_PRIVATE_KEY not configured");
		}

		const account = privateKeyToAccount(privateKey as `0x${string}`);
		console.log(`[YellowService] House wallet: ${account.address}`);

		const walletClient = createWalletClient({
			account,
			chain: base,
			transport: http(),
		});

		this.client = new YellowClient({
			clearNodeUrl: CLEARNODE_SANDBOX_URL,
		});

		await this.client.connect(walletClient);
		this.initialized = true;

		console.log("[YellowService] Initialized and connected to ClearNode");
	}

	private async ensureClient(): Promise<YellowClient> {
		await this.initialize();
		if (!this.client) {
			throw new Error("YellowClient not initialized");
		}
		return this.client;
	}

	/**
	 * Place a bet on a market. Creates session if needed.
	 */
	async placeBet(params: {
		marketId: string;
		userAddress: string;
		side: BetSide;
		amount: string;
	}): Promise<{
		market: Market;
		session: MarketSession;
	}> {
		const client = await this.ensureClient();
		const market = getMarketById(params.marketId);
		if (!market) throw new Error(`Market not found: ${params.marketId}`);
		if (market.status !== "open") throw new Error(`Market is ${market.status}`);
		if (Date.now() > market.closesAt) throw new Error("Market has expired");

		const houseAddress = client.getWalletAddress();
		if (!houseAddress) throw new Error("House wallet not available");

		// Get or create session for this market
		let session = this.sessions.get(params.marketId);
		if (!session) {
			session = await createMarketSession(
				client,
				params.marketId,
				houseAddress as `0x${string}`,
			);
			this.sessions.set(params.marketId, session);
			market.sessionId = session.sessionId;
		}

		// Add bet to session
		const betParams: PoolBetParams = {
			userAddress: params.userAddress as `0x${string}`,
			marketId: params.marketId,
			side: params.side,
			amount: params.amount,
		};

		session = await addBetToMarket(client, session, betParams);
		this.sessions.set(params.marketId, session);

		// Update market state
		const betAmount = BigInt(params.amount);
		if (params.side === "UP") {
			market.upParticipants.push(params.userAddress);
			market.upBets.push(betAmount);
			market.upPool += betAmount;
		} else {
			market.downParticipants.push(params.userAddress);
			market.downBets.push(betAmount);
			market.downPool += betAmount;
		}
		market.totalPot = market.upPool + market.downPool;

		return { market, session };
	}

	/**
	 * Get pool stats for a market
	 */
	getMarketPools(marketId: string): {
		upPool: string;
		downPool: string;
		totalPot: string;
		upParticipants: number;
		downParticipants: number;
		upPercentage: number;
		downPercentage: number;
	} {
		const market = getMarketById(marketId);
		if (!market) throw new Error(`Market not found: ${marketId}`);

		const total = market.upPool + market.downPool;
		const upPct =
			total > BigInt(0)
				? Number((market.upPool * BigInt(10000)) / total) / 100
				: 50;
		const downPct = total > BigInt(0) ? 100 - upPct : 50;

		return {
			upPool: market.upPool.toString(),
			downPool: market.downPool.toString(),
			totalPot: market.totalPot.toString(),
			upParticipants: market.upParticipants.length,
			downParticipants: market.downParticipants.length,
			upPercentage: upPct,
			downPercentage: downPct,
		};
	}

	/**
	 * Settle a market with determined outcome
	 */
	async settleMarket(
		marketId: string,
		winner: BetSide,
		reasoning: string,
		attentionData: { baseline: number; current: number; change: number; changePercent: number },
	): Promise<{
		market: Market;
		distributions: ReturnType<typeof calculateProportionalDistribution>["distributions"];
	}> {
		const client = await this.ensureClient();
		const market = getMarketById(marketId);
		if (!market) throw new Error(`Market not found: ${marketId}`);

		const session = this.sessions.get(marketId);

		// Calculate proportional distribution
		const upPool = {
			side: "UP" as const,
			participants: market.upParticipants as `0x${string}`[],
			amounts: market.upBets,
			totalAmount: market.upPool,
		};
		const downPool = {
			side: "DOWN" as const,
			participants: market.downParticipants as `0x${string}`[],
			amounts: market.downBets,
			totalAmount: market.downPool,
		};

		let distributions: ReturnType<
			typeof calculateProportionalDistribution
		>["distributions"] = [];

		// Only calculate if there are bets on both sides
		if (market.upPool > BigInt(0) && market.downPool > BigInt(0)) {
			const result = calculateProportionalDistribution(
				upPool,
				downPool,
				winner,
			);
			distributions = result.distributions;

			// Settle on Yellow if session exists
			if (session) {
				const outcome: SettlementOutcome = {
					marketId,
					winner,
					finalAllocations: result.allocations,
					distributions,
					reasoning,
					attentionData,
				};
				await settleMarketSession(client, session, outcome);
				this.sessions.delete(marketId);
			}
		}

		// Update market state
		market.status = "closed";
		market.result = winner;
		market.finalValue = attentionData.current;
		market.aiReasoning = reasoning;
		market.resolvedAt = Date.now();

		return { market, distributions };
	}

	getStatus(): {
		initialized: boolean;
		connected: boolean;
		authenticated: boolean;
		balance: string;
		activeSessions: number;
	} {
		const clientStatus = this.client?.getStatus();
		return {
			initialized: this.initialized,
			connected: clientStatus?.connected ?? false,
			authenticated: clientStatus?.authenticated ?? false,
			balance: clientStatus?.unifiedBalance ?? "0",
			activeSessions: this.sessions.size,
		};
	}
}

export const yellowService = new YellowService();
