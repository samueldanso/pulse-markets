/**
 * Yellow Network Constants
 * Configuration values for Yellow state channels integration
 */

import { base } from "viem/chains";

/** Yellow ClearNode WebSocket endpoint (production) */
export const CLEARNODE_URL = "wss://clearnet.yellow.com/ws";

/** Yellow ClearNode WebSocket endpoint (sandbox - for testing only) */
export const CLEARNODE_SANDBOX_URL = "wss://clearnet-sandbox.yellow.com/ws";

/** Base chain configuration */
export const YELLOW_CHAIN = base;
export const YELLOW_CHAIN_ID = base.id; // 8453

/** USDC contract address on Base mainnet */
export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

/** USDC decimals */
export const USDC_DECIMALS = 6;

import { RPCProtocolVersion } from "@erc7824/nitrolite";

/** NitroRPC protocol version */
export const PROTOCOL_VERSION = RPCProtocolVersion.NitroRPC_0_4;

/** Session duration (1 hour in seconds) */
export const SESSION_DURATION = 3600;

/** App identification */
export const APP_NAME = "PulseMarkets";
export const AUTH_SCOPE = "console";

/** Challenge period for state channels (0 for instant settlement in hackathon) */
export const CHALLENGE_PERIOD = 0;

/**
 * Custody and Adjudicator contract addresses for Base
 * These are fetched dynamically via get_config RPC, but provided as fallbacks
 * Reference: https://docs.yellow.org/docs/learn/getting-started/quickstart/
 */
export const BASE_CUSTODY_ADDRESS =
	"0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6" as const;
export const BASE_ADJUDICATOR_ADDRESS =
	"0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C" as const;
