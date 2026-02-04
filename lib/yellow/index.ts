/**
 * Yellow Network Integration
 * Exports all Yellow state channel functionality
 */

// Client
export { YellowClient } from "./client";

// Auth
export { generateSessionKey, getSessionExpiry } from "./auth";

// Deposit
export {
	depositToCustody,
	getWalletUSDCBalance,
	getCustodyBalance,
} from "./deposit";

// Channels
export {
	createChannel,
	allocateToChannel,
	deallocateFromChannel,
	getChannels,
	getOrCreateChannel,
} from "./channels";

// Sessions (Pool-based Markets)
export {
	createMarketSession,
	addBetToMarket,
	settleMarketSession,
	calculateProportionalDistribution,
} from "./sessions";

// Types
export type {
	SessionKey,
	YellowClientConfig,
	ChannelInfo,
	UnifiedBalance,
	MarketPool,
	MarketSession,
	PoolBetParams,
	ProportionalDistribution,
	SettlementOutcome,
	YellowConnectionStatus,
	DepositResult,
	AllocateParams,
} from "./types";

// Constants
export {
	CLEARNODE_URL,
	CLEARNODE_SANDBOX_URL,
	YELLOW_CHAIN,
	YELLOW_CHAIN_ID,
	USDC_ADDRESS,
	USDC_DECIMALS,
	PROTOCOL_VERSION,
	SESSION_DURATION,
	APP_NAME,
	AUTH_SCOPE,
	CHALLENGE_PERIOD,
	BASE_CUSTODY_ADDRESS,
	BASE_ADJUDICATOR_ADDRESS,
} from "./constants";
