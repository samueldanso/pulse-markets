/**
 * Yellow Network TypeScript Types
 * Type definitions for Yellow state channels integration
 */

import type { Hex } from "viem";
import type {
	RPCAppDefinition,
	RPCAppSessionAllocation,
} from "@erc7824/nitrolite";

/** Session key pair for authentication */
export interface SessionKey {
	privateKey: Hex;
	address: Hex;
}

/** Yellow client configuration */
export interface YellowClientConfig {
	/** ClearNode WebSocket URL */
	clearNodeUrl: string;
	/** House wallet private key (server-side only) */
	housePrivateKey?: Hex;
	/** House wallet address */
	houseAddress?: Hex;
}

/** Channel information */
export interface ChannelInfo {
	channelId: Hex;
	chainId: number;
	asset: string;
	balance: string;
	status: "open" | "closing" | "closed";
	participants: Hex[];
}

/** Unified ledger balance */
export interface UnifiedBalance {
	asset: string;
	amount: string;
	chainId: number;
}

/** Pool state for one side of a binary prediction market */
export interface MarketPool {
	side: "UP" | "DOWN";
	participants: Hex[];
	amounts: bigint[];
	totalAmount: bigint;
}

/** Market session state (one per market, N participants) */
export interface MarketSession {
	marketId: string;
	sessionId: string;
	upPool: MarketPool;
	downPool: MarketPool;
	houseAddress: Hex;
	status: "open" | "locked" | "settling" | "closed";
	createdAt: number;
	definition: RPCAppDefinition;
	allocations: RPCAppSessionAllocation[];
}

/** Parameters for placing a pool bet */
export interface PoolBetParams {
	userAddress: Hex;
	marketId: string;
	side: "UP" | "DOWN";
	amount: string; // USDC in smallest units (6 decimals)
}

/** Proportional distribution calculation result */
export interface ProportionalDistribution {
	participant: Hex;
	side: "UP" | "DOWN";
	stakeAmount: bigint;
	payoutAmount: bigint;
	profitPercent: number;
}

/** Settlement outcome for pool-based market */
export interface SettlementOutcome {
	marketId: string;
	winner: "UP" | "DOWN";
	finalAllocations: RPCAppSessionAllocation[];
	distributions: ProportionalDistribution[];
	reasoning: string; // AI-generated reasoning
	attentionData: {
		baseline: number;
		current: number;
		change: number;
		changePercent: number;
	};
}

/** Yellow service connection status */
export interface YellowConnectionStatus {
	connected: boolean;
	authenticated: boolean;
	sessionExpiry: number | null;
	channelId: Hex | null;
	unifiedBalance: string; // USDC balance
}

/** Deposit result */
export interface DepositResult {
	txHash: Hex;
	amount: string;
	asset: string;
	chainId: number;
}

/** Channel allocation parameters */
export interface AllocateParams {
	channelId: Hex;
	amount: string; // Amount to move from Unified Balance to Channel
}
