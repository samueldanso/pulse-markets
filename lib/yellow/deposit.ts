/**
 * Yellow Network Deposit
 * Handles depositing USDC to custody contract on Base
 */

import {
	NitroliteClient,
	WalletStateSigner,
	type ContractAddresses,
} from "@erc7824/nitrolite";
import type { PublicClient, WalletClient } from "viem";
import { formatUnits, parseUnits } from "viem";
import type { DepositResult } from "./types";
import {
	USDC_ADDRESS,
	USDC_DECIMALS,
	YELLOW_CHAIN_ID,
	BASE_CUSTODY_ADDRESS,
	BASE_ADJUDICATOR_ADDRESS,
} from "./constants";

/**
 * Deposit USDC to Yellow custody contract on Base
 * This is an on-chain transaction that requires gas fees
 *
 * @param walletClient - Viem wallet client
 * @param publicClient - Viem public client
 * @param amount - Amount in USDC (e.g., "2.5" for 2.5 USDC)
 * @returns Deposit result with transaction hash
 */
export async function depositToCustody(
	walletClient: WalletClient,
	publicClient: PublicClient,
	amount: string,
): Promise<DepositResult> {
	console.log(`[Yellow] Depositing ${amount} USDC to custody...`);

	// Ensure wallet client has account
	if (!walletClient.account) {
		throw new Error("Wallet client must have an account");
	}

	// Initialize NitroliteClient
	const nitroliteClient = new NitroliteClient({
		walletClient: walletClient as any,
		publicClient: publicClient as any,
		stateSigner: new WalletStateSigner(walletClient as any),
		addresses: {
			custody: BASE_CUSTODY_ADDRESS,
			adjudicator: BASE_ADJUDICATOR_ADDRESS,
		} as ContractAddresses,
		chainId: YELLOW_CHAIN_ID,
		challengeDuration: BigInt(3600), // 1 hour
	});

	// Convert amount to smallest units (6 decimals for USDC)
	const depositAmount = parseUnits(amount, USDC_DECIMALS);

	console.log(`[Yellow] Deposit amount: ${depositAmount} units`);

	// Execute deposit (triggers approve + deposit transactions)
	const txHash = await nitroliteClient.deposit(USDC_ADDRESS, depositAmount);

	console.log(`[Yellow] Deposit tx hash: ${txHash}`);

	// Wait for transaction confirmation
	const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

	console.log(
		`[Yellow] Deposit confirmed in block ${receipt.blockNumber.toString()}`,
	);

	return {
		txHash,
		amount: depositAmount.toString(),
		asset: "usdc",
		chainId: YELLOW_CHAIN_ID,
	};
}

/**
 * Get USDC balance in wallet (on-chain, not Yellow)
 *
 * @param publicClient - Viem public client
 * @param address - Wallet address to check
 * @returns USDC balance as string (e.g., "2.5")
 */
export async function getWalletUSDCBalance(
	publicClient: PublicClient,
	address: `0x${string}`,
): Promise<string> {
	const balance = await publicClient.readContract({
		address: USDC_ADDRESS as `0x${string}`,
		abi: [
			{
				name: "balanceOf",
				type: "function",
				stateMutability: "view",
				inputs: [{ name: "account", type: "address" }],
				outputs: [{ name: "", type: "uint256" }],
			},
		],
		functionName: "balanceOf",
		args: [address],
	});

	return formatUnits(balance, USDC_DECIMALS);
}

/**
 * Get custody balance (on-chain balance in Yellow custody contract)
 *
 * @param nitroliteClient - Initialized NitroliteClient
 * @param address - Wallet address to check
 * @returns Custody balance as string
 */
export async function getCustodyBalance(
	nitroliteClient: NitroliteClient,
	address: `0x${string}`,
): Promise<string> {
	// TODO: Implement getCustodyBalance via NitroliteClient
	// For now, return "0" - will be implemented when needed
	console.warn("[Yellow] getCustodyBalance not yet implemented");
	return "0";
}
