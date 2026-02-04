/**
 * Yellow Network App Sessions - Pool-Based Prediction Markets
 * Handles multi-party market sessions using Yellow state channels
 */

import {
	createAppSessionMessage,
	createSubmitAppStateMessage,
	createCloseAppSessionMessage,
	type RPCAppDefinition,
	type RPCAppSessionAllocation,
} from "@erc7824/nitrolite";
import type { Hex } from "viem";
import type { YellowClient } from "./client";
import type {
	MarketSession,
	PoolBetParams,
	SettlementOutcome,
	MarketPool,
	ProportionalDistribution,
} from "./types";
import { PROTOCOL_VERSION, CHALLENGE_PERIOD } from "./constants";

/**
 * Create a market session (app session) on Yellow Network
 * One session per market, supports N participants
 *
 * @param client - YellowClient instance
 * @param marketId - Unique market identifier
 * @param houseAddress - House wallet address
 * @returns Market session with empty pools
 */
export async function createMarketSession(
	client: YellowClient,
	marketId: string,
	houseAddress: Hex,
): Promise<MarketSession> {
	const sessionSigner = client.getSessionSigner();
	if (!sessionSigner) {
		throw new Error("Client not authenticated");
	}

	console.log(`[Yellow] Creating market session for ${marketId}`);

	// App definition: house has tiebreaker for disputes
	const definition: RPCAppDefinition = {
		protocol: PROTOCOL_VERSION,
		participants: [houseAddress], // Start with house only
		weights: [100], // House controls until users join
		quorum: 100, // Majority consensus
		challenge: CHALLENGE_PERIOD,
		nonce: Date.now(), // Unique per market
		application: `PulseMarkets:${marketId}`,
	};

	// Initial allocations: house deposits 0 (only collects fees)
	const allocations: RPCAppSessionAllocation[] = [
		{
			participant: houseAddress,
			asset: "usdc",
			amount: "0",
		},
	];

	// Create app session message
	const sessionMessage = await createAppSessionMessage(sessionSigner, {
		definition,
		allocations,
	});

	// Send to Yellow Network
	const response = (await client.sendMessage(sessionMessage)) as any;

	const sessionId = response.params?.app_session_id as string;
	if (!sessionId) {
		throw new Error("Failed to create market session - no app_session_id");
	}

	console.log(`[Yellow] Market session created: ${sessionId}`);

	// Initialize empty pools
	const upPool: MarketPool = {
		side: "UP",
		participants: [],
		amounts: [],
		totalAmount: BigInt(0),
	};

	const downPool: MarketPool = {
		side: "DOWN",
		participants: [],
		amounts: [],
		totalAmount: BigInt(0),
	};

	return {
		sessionId,
		marketId,
		upPool,
		downPool,
		houseAddress,
		status: "open",
		createdAt: Date.now(),
		definition,
		allocations,
	};
}

/**
 * Add a bet to an existing market session
 * Updates Yellow app session with new participant + allocation
 *
 * @param client - YellowClient instance
 * @param session - Current market session
 * @param params - Bet parameters (user, side, amount)
 * @returns Updated market session
 */
export async function addBetToMarket(
	client: YellowClient,
	session: MarketSession,
	params: PoolBetParams,
): Promise<MarketSession> {
	const sessionSigner = client.getSessionSigner();
	if (!sessionSigner) {
		throw new Error("Client not authenticated");
	}

	if (session.status !== "open") {
		throw new Error(`Market is ${session.status}, cannot add bets`);
	}

	console.log(
		`[Yellow] Adding ${params.side} bet: ${params.userAddress} for ${params.amount} USDC`,
	);

	// Determine which pool to update
	const targetPool = params.side === "UP" ? session.upPool : session.downPool;
	const otherPool = params.side === "UP" ? session.downPool : session.upPool;

	// Check if user already bet on this side
	if (targetPool.participants.includes(params.userAddress)) {
		throw new Error(`User already bet ${params.side} on this market`);
	}

	// Update pool state
	const updatedTargetPool: MarketPool = {
		...targetPool,
		participants: [...targetPool.participants, params.userAddress],
		amounts: [...targetPool.amounts, BigInt(params.amount)],
		totalAmount: targetPool.totalAmount + BigInt(params.amount),
	};

	// Build new participants list (house + all users)
	const allParticipants: Hex[] = [
		session.houseAddress,
		...updatedTargetPool.participants,
		...otherPool.participants,
	];

	// Build new allocations (house gets 0, users deposit their stake)
	const allAllocations: RPCAppSessionAllocation[] = [
		{
			participant: session.houseAddress,
			asset: "usdc",
			amount: "0",
		},
		...updatedTargetPool.participants.map((addr, idx) => ({
			participant: addr,
			asset: "usdc" as const,
			amount: updatedTargetPool.amounts[idx].toString(),
		})),
		...otherPool.participants.map((addr, idx) => ({
			participant: addr,
			asset: "usdc" as const,
			amount: otherPool.amounts[idx].toString(),
		})),
	];

	// Update weights (house gets 10%, rest split evenly)
	const userCount = allParticipants.length - 1;
	const houseWeight = 10;
	const userWeight = userCount > 0 ? Math.floor(90 / userCount) : 90;
	const weights = [houseWeight, ...Array(userCount).fill(userWeight)];

	// Update app definition with new participants
	const updatedDefinition: RPCAppDefinition = {
		...session.definition,
		participants: allParticipants,
		weights,
		quorum: 60, // Majority consensus
	};

	// Submit app state update
	const updateMessage = await createSubmitAppStateMessage(sessionSigner, {
		app_session_id: session.sessionId as Hex,
		allocations: allAllocations,
	});

	await client.sendMessage(updateMessage);

	console.log(`[Yellow] Bet added to market session ${session.sessionId}`);

	// Return updated session
	return {
		...session,
		upPool: params.side === "UP" ? updatedTargetPool : session.upPool,
		downPool: params.side === "DOWN" ? updatedTargetPool : session.downPool,
		definition: updatedDefinition,
		allocations: allAllocations,
	};
}

/**
 * Calculate proportional distribution for pool winners
 * Formula: userPayout = (userStake / totalWinningPool) × (totalPot - houseFee)
 *
 * @param upPool - UP side pool state
 * @param downPool - DOWN side pool state
 * @param winner - Which side won (UP or DOWN)
 * @param houseFeePercent - House fee percentage (e.g., 2.5 for 2.5%)
 * @returns Allocations for closing the session + distribution breakdown
 */
export function calculateProportionalDistribution(
	upPool: MarketPool,
	downPool: MarketPool,
	winner: "UP" | "DOWN",
	houseFeePercent = 2.5,
): {
	allocations: RPCAppSessionAllocation[];
	distributions: ProportionalDistribution[];
} {
	const totalPot = upPool.totalAmount + downPool.totalAmount;
	const fee = (totalPot * BigInt(Math.floor(houseFeePercent * 100))) / BigInt(10000);
	const payoutPot = totalPot - fee;

	const winningPool = winner === "UP" ? upPool : downPool;
	const losingPool = winner === "UP" ? downPool : upPool;

	console.log(
		`[Yellow] Calculating distribution: ${winner} wins, pot = ${totalPot}, fee = ${fee}`,
	);

	if (winningPool.totalAmount === BigInt(0)) {
		throw new Error("Winning pool has no participants");
	}

	// Calculate proportional payouts for winners
	const distributions: ProportionalDistribution[] = winningPool.participants.map(
		(participant, idx) => {
			const stakeAmount = winningPool.amounts[idx];
			const payoutAmount =
				(stakeAmount * payoutPot) / winningPool.totalAmount;
			const profitPercent =
				Number(((payoutAmount - stakeAmount) * BigInt(10000)) / stakeAmount) / 100;

			return {
				participant,
				side: winner,
				stakeAmount,
				payoutAmount,
				profitPercent,
			};
		},
	);

	// Add losers (get 0)
	const loserDistributions: ProportionalDistribution[] =
		losingPool.participants.map((participant, idx) => ({
			participant,
			side: losingPool.side,
			stakeAmount: losingPool.amounts[idx],
			payoutAmount: BigInt(0),
			profitPercent: -100,
		}));

	distributions.push(...loserDistributions);

	// Build allocations for Yellow session closure
	const allocations: RPCAppSessionAllocation[] = [
		// Winners get proportional share
		...distributions
			.filter((d) => d.payoutAmount > BigInt(0))
			.map((d) => ({
				participant: d.participant,
				asset: "usdc" as const,
				amount: d.payoutAmount.toString(),
			})),
		// Losers get 0 (must still be in allocations)
		...loserDistributions.map((d) => ({
			participant: d.participant,
			asset: "usdc" as const,
			amount: "0",
		})),
	];

	// House gets fee (if any)
	if (fee > BigInt(0)) {
		// House fee is implicit (difference between totalPot and sum of payouts)
		// Yellow will handle this automatically
	}

	return { allocations, distributions };
}

/**
 * Settle market session with outcome
 * Updates session with final allocations and closes it
 *
 * @param client - YellowClient instance
 * @param session - Market session to settle
 * @param outcome - Settlement outcome (winner + AI reasoning)
 * @returns Void (session is closed)
 */
export async function settleMarketSession(
	client: YellowClient,
	session: MarketSession,
	outcome: SettlementOutcome,
): Promise<void> {
	const sessionSigner = client.getSessionSigner();
	if (!sessionSigner) {
		throw new Error("Client not authenticated");
	}

	if (session.status !== "open" && session.status !== "locked") {
		throw new Error(`Cannot settle market in ${session.status} state`);
	}

	console.log(
		`[Yellow] Settling market ${session.marketId}: ${outcome.winner} wins`,
	);

	// Calculate proportional distribution
	const { allocations } = calculateProportionalDistribution(
		session.upPool,
		session.downPool,
		outcome.winner,
	);

	// Submit final state
	const updateMessage = await createSubmitAppStateMessage(sessionSigner, {
		app_session_id: session.sessionId as Hex,
		allocations,
	});

	await client.sendMessage(updateMessage);

	// Close session
	const closeMessage = await createCloseAppSessionMessage(sessionSigner, {
		app_session_id: session.sessionId as Hex,
		allocations,
	});

	await client.sendMessage(closeMessage);

	console.log(`[Yellow] Market session ${session.sessionId} settled and closed`);
}
