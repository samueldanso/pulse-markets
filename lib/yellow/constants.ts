import { base, sepolia } from "viem/chains";
import { RPCProtocolVersion } from "@erc7824/nitrolite";

type YellowNetwork = "sandbox" | "mainnet";

const NETWORK: YellowNetwork =
  (process.env.YELLOW_NETWORK as YellowNetwork) || "sandbox";

const IS_SANDBOX = NETWORK === "sandbox";

/** ClearNode WebSocket URL */
export const CLEARNODE_URL = IS_SANDBOX
  ? "wss://clearnet-sandbox.yellow.com/ws"
  : "wss://clearnet.yellow.com/ws";

/** Asset identifier (sandbox = ytest.usd, mainnet = usdc) */
export const YELLOW_ASSET = IS_SANDBOX ? "ytest.usd" : "usdc";

/** Faucet URL (sandbox only — null on mainnet) */
export const FAUCET_URL = IS_SANDBOX
  ? "https://clearnet-sandbox.yellow.com/faucet/requestTokens"
  : null;

/** Chain used for Yellow operations */
export const YELLOW_CHAIN = IS_SANDBOX ? sepolia : base;
export const YELLOW_CHAIN_ID = YELLOW_CHAIN.id;

/** USDC contract address on Base mainnet */
export const USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export const USDC_DECIMALS = 6;

export const PROTOCOL_VERSION = RPCProtocolVersion.NitroRPC_0_4;

export const SESSION_DURATION = 3600;

export const APP_NAME = "PulseMarkets";
export const AUTH_SCOPE = "console";

/** Challenge period (seconds). SDK default is 120. */
export const CHALLENGE_PERIOD = 120;

/** Custody and Adjudicator contract addresses (Base mainnet) */
export const BASE_CUSTODY_ADDRESS =
  "0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6" as const;
export const BASE_ADJUDICATOR_ADDRESS =
  "0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C" as const;

/** Sandbox custody/adjudicator (Sepolia) */
export const SANDBOX_CUSTODY_ADDRESS =
  "0x019B65A265EB3363822f2752141b3dF16131b262" as const;
export const SANDBOX_ADJUDICATOR_ADDRESS =
  "0x7c7ccbc98469190849BCC6c926307794fDfB11F2" as const;

export const CUSTODY_ADDRESS = IS_SANDBOX
  ? SANDBOX_CUSTODY_ADDRESS
  : BASE_CUSTODY_ADDRESS;
export const ADJUDICATOR_ADDRESS = IS_SANDBOX
  ? SANDBOX_ADJUDICATOR_ADDRESS
  : BASE_ADJUDICATOR_ADDRESS;
