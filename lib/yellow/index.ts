/**
 * Yellow Network Integration
 * Exports all Yellow state channel functionality
 */

// Auth
export { generateSessionKey, getSessionExpiry } from "./auth";
// Channels
export {
  allocateToChannel,
  createChannel,
  deallocateFromChannel,
  getChannels,
  getOrCreateChannel,
} from "./channels";
// Client
export { YellowClient } from "./client";
// Constants
export {
  APP_NAME,
  AUTH_SCOPE,
  BASE_ADJUDICATOR_ADDRESS,
  BASE_CUSTODY_ADDRESS,
  CHALLENGE_PERIOD,
  CLEARNODE_URL,
  PROTOCOL_VERSION,
  SESSION_DURATION,
  USDC_ADDRESS,
  USDC_DECIMALS,
  YELLOW_CHAIN,
  YELLOW_CHAIN_ID,
} from "./constants";
// Deposit
export {
  depositToCustody,
  getCustodyBalance,
  getWalletUSDCBalance,
} from "./deposit";
// Sessions (Pool-based Markets)
export {
  addBetToMarket,
  calculateProportionalDistribution,
  createMarketSession,
  settleMarketSession,
} from "./sessions";
// Types
export type {
  AllocateParams,
  ChannelInfo,
  DepositResult,
  MarketPool,
  MarketSession,
  PoolBetParams,
  ProportionalDistribution,
  SessionKey,
  SettlementOutcome,
  UnifiedBalance,
  YellowClientConfig,
  YellowConnectionStatus,
} from "./types";
