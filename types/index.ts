export type MarketCategory = "sentiment" | "narrative" | "viral";
export type MarketStatus = "open" | "closed" | "settling" | "resolved";
export type BetSide = "YES" | "NO";
export type ThresholdType = "percentage" | "absolute";

export interface Market {
  id: string;
  question: string;
  category: MarketCategory;
  topic: string;

  createdAt: number;
  closesAt: number;
  status: MarketStatus;

  baseline: number;
  threshold: number;
  thresholdType: ThresholdType;

  yesPool: number;
  noPool: number;

  result?: BetSide;
  finalValue?: number;
  aiReasoning?: string;
  resolvedAt?: number;
}

export interface Position {
  id: string;
  marketId: string;
  side: BetSide;
  amount: number;
  timestamp: number;
  settled: boolean;
  payout?: number;
}

export interface UserState {
  address: string;
  channelId?: string;
  balance: number;
  positions: Position[];
}

export interface SettlementResult {
  marketId: string;
  result: BetSide;
  baseline: number;
  finalValue: number;
  change: number;
  confidence: number;
  reasoning: string;
  agentAddress: string;
  txHash?: string;
}

export interface YellowChannelState {
  channelId: string | null;
  isOpen: boolean;
  balance: number;
  isSimulated: boolean;
}
