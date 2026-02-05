/**
 * Yellow Network Authentication
 * Session key generation and EIP-712 authentication flow
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { SessionKey } from "./types";

/**
 * Generate a temporary session key for Yellow Network authentication
 * Session keys allow signing RPC messages without main wallet popups
 *
 * @returns Session key pair (private key + address)
 */
export function generateSessionKey(): SessionKey {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  return {
    privateKey,
    address: account.address,
  };
}

/**
 * Calculate session expiry timestamp
 *
 * @param durationSeconds - Session duration in seconds (default: 1 hour)
 * @returns Unix timestamp when session expires
 */
export function getSessionExpiry(durationSeconds = 3600): number {
  return Math.floor(Date.now() / 1000) + durationSeconds;
}
