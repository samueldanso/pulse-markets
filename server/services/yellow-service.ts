/**
 * Yellow Service Singleton
 * Server-side Yellow Network connection manager.
 * Connects to ClearNode with operator wallet, coordinates market sessions.
 */

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { getMarketById, MARKETS } from "@/data/markets";
import { YellowClient } from "@/lib/yellow/client";
import {
  allocateToChannel,
  deallocateFromChannel,
  getOrCreateChannel,
} from "@/lib/yellow/channels";
import {
  CLEARNODE_URL,
  CUSTODY_ADDRESS,
  FAUCET_URL,
  USDC_ADDRESS,
  USDC_DECIMALS,
  YELLOW_ASSET,
  YELLOW_CHAIN,
  YELLOW_CHAIN_ID,
} from "@/lib/yellow/constants";
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

interface UserState {
  balance: string;
  channelId: string | null;
}

class YellowService {
  private client: YellowClient | null = null;
  private sessions = new Map<string, MarketSession>();
  private userStates = new Map<string, UserState>();
  private initialized = false;
  private initializing: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this.doInitialize();
    return this.initializing;
  }

  private async doInitialize(): Promise<void> {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`[YellowService] Operator wallet: ${account.address}`);

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    this.client = new YellowClient({
      clearNodeUrl: CLEARNODE_URL,
    });

    await this.client.connect(walletClient);
    this.initialized = true;

    console.log("[YellowService] Initialized and connected to ClearNode");

    await this.requestFaucetFunds(account.address);
  }

  private async requestFaucetFunds(address: string): Promise<void> {
    if (!FAUCET_URL) return;

    try {
      const res = await fetch(FAUCET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address }),
      });
      if (res.ok) {
        console.log(`[YellowService] Faucet funded: ${address}`);
      } else {
        console.warn(`[YellowService] Faucet request failed: ${res.status}`);
      }
    } catch (error) {
      console.warn("[YellowService] Faucet unavailable:", error instanceof Error ? error.message : error);
    }
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

    const operatorAddress = client.getWalletAddress();
    if (!operatorAddress) throw new Error("Operator wallet not available");

    let session = this.sessions.get(params.marketId);
    if (!session) {
      await this.requestFaucetFunds(params.userAddress);

      session = await createMarketSession(
        client,
        params.marketId,
        operatorAddress as `0x${string}`,
        params.userAddress as `0x${string}`,
      );
      this.sessions.set(params.marketId, session);
      market.sessionId = session.sessionId;
    }

    this.deductUserBalance(params.userAddress, params.amount);

    const betParams: PoolBetParams = {
      userAddress: params.userAddress as `0x${string}`,
      marketId: params.marketId,
      side: params.side,
      amount: params.amount,
    };

    session = await addBetToMarket(client, session, betParams);
    this.sessions.set(params.marketId, session);
    console.log(`[YellowService] Bet recorded on Yellow session`);

    // Always update in-memory market state (works even if Yellow fails)
    const betAmount = BigInt(params.amount);
    if (params.side === "UP") {
      const existingIdx = market.upParticipants.indexOf(params.userAddress);
      if (existingIdx >= 0) {
        market.upBets[existingIdx] += betAmount;
      } else {
        market.upParticipants.push(params.userAddress);
        market.upBets.push(betAmount);
      }
      market.upPool += betAmount;
    } else {
      const existingIdx = market.downParticipants.indexOf(params.userAddress);
      if (existingIdx >= 0) {
        market.downBets[existingIdx] += betAmount;
      } else {
        market.downParticipants.push(params.userAddress);
        market.downBets.push(betAmount);
      }
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
    attentionData: {
      baseline: number;
      current: number;
      change: number;
      changePercent: number;
    },
  ): Promise<{
    market: Market;
    distributions: ReturnType<
      typeof calculateProportionalDistribution
    >["distributions"];
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

  private getUserState(address: string): UserState {
    const key = address.toLowerCase();
    let state = this.userStates.get(key);
    if (!state) {
      state = { balance: "0", channelId: null };
      this.userStates.set(key, state);
    }
    return state;
  }

  private get isSandbox(): boolean {
    return (process.env.YELLOW_NETWORK || "sandbox") !== "mainnet";
  }

  async depositForUser(
    address: string,
    amount: string,
    txHash?: string,
  ): Promise<{ balance: string; channelId: string | null }> {
    const state = this.getUserState(address);

    if (this.isSandbox) {
      const client = await this.ensureClient();
      await this.requestFaucetFunds(address);

      let channelId = state.channelId;
      if (!channelId) {
        channelId = await getOrCreateChannel(client);
        state.channelId = channelId;
      }

      await allocateToChannel(client, { channelId: channelId as `0x${string}`, amount });
    }

    const prev = BigInt(state.balance);
    const added = BigInt(amount);
    state.balance = (prev + added).toString();

    const mode = this.isSandbox ? "sandbox" : "mainnet";
    const txInfo = txHash ? ` (tx: ${txHash})` : "";
    console.log(
      `[YellowService] Deposited ${amount} for ${address} [${mode}]${txInfo}. Balance: ${state.balance}`,
    );

    return { balance: state.balance, channelId: state.channelId };
  }

  async withdrawForUser(
    address: string,
    amount: string,
  ): Promise<{ balance: string }> {
    const client = await this.ensureClient();
    const state = this.getUserState(address);

    const current = BigInt(state.balance);
    const withdrawal = BigInt(amount);
    if (withdrawal > current) {
      throw new Error("Insufficient balance");
    }

    if (state.channelId) {
      await deallocateFromChannel(
        client,
        state.channelId as `0x${string}`,
        amount,
      );
    }

    const newBalance = current - withdrawal;
    state.balance = newBalance.toString();

    if (newBalance === BigInt(0)) {
      state.channelId = null;
    }

    console.log(
      `[YellowService] Withdrew ${amount} for ${address}. Balance: ${state.balance}`,
    );

    return { balance: state.balance };
  }

  getUserBalance(address: string): {
    balance: string;
    channelId: string | null;
  } {
    const state = this.getUserState(address);
    return { balance: state.balance, channelId: state.channelId };
  }

  deductUserBalance(address: string, amount: string): void {
    const state = this.getUserState(address);
    const current = BigInt(state.balance);
    const deduction = BigInt(amount);
    if (deduction > current) {
      throw new Error("Insufficient balance");
    }
    state.balance = (current - deduction).toString();
  }

  creditUserBalance(address: string, amount: string): void {
    const state = this.getUserState(address);
    const current = BigInt(state.balance);
    state.balance = (current + BigInt(amount)).toString();
  }

  getNetworkConfig(): {
    network: string;
    chainId: number;
    chainName: string;
    asset: string;
    usdcAddress: string;
    custodyAddress: string;
    clearNodeUrl: string;
    faucetUrl: string | null;
  } {
    return {
      network: process.env.YELLOW_NETWORK || "sandbox",
      chainId: YELLOW_CHAIN_ID,
      chainName: YELLOW_CHAIN.name,
      asset: YELLOW_ASSET,
      usdcAddress: USDC_ADDRESS,
      custodyAddress: CUSTODY_ADDRESS,
      clearNodeUrl: CLEARNODE_URL,
      faucetUrl: FAUCET_URL,
    };
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
