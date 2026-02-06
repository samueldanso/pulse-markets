/**
 * ERC-8004 Agent Identity Constants
 * Contract addresses and chain config for Base mainnet.
 * Reference: resources/erc-8004/erc-8004-contracts/README.md
 */

import { base, baseSepolia } from "viem/chains";

/** Base mainnet contract addresses (same across all EVM mainnet deployments) */
export const IDENTITY_REGISTRY_ADDRESS =
  "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;
export const REPUTATION_REGISTRY_ADDRESS =
  "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" as const;

/** Base Sepolia testnet contract addresses */
export const IDENTITY_REGISTRY_TESTNET =
  "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
export const REPUTATION_REGISTRY_TESTNET =
  "0x8004B663056A597Dffe9eCcC1965A193B7388713" as const;

export const AGENT_CHAIN = base;
export const AGENT_CHAIN_TESTNET = baseSepolia;

/** Agent registry identifier format: {namespace}:{chainId}:{identityRegistry} */
export const AGENT_REGISTRY_ID =
  `eip155:${base.id}:${IDENTITY_REGISTRY_ADDRESS}` as const;
export const AGENT_REGISTRY_TESTNET_ID =
  `eip155:${baseSepolia.id}:${IDENTITY_REGISTRY_TESTNET}` as const;

/** 8004scan explorer base URL */
export const EXPLORER_BASE_URL = "https://www.8004scan.io/agents";

/** Registration file type per spec */
export const REGISTRATION_TYPE =
  "https://eips.ethereum.org/EIPS/eip-8004#registration-v1" as const;
