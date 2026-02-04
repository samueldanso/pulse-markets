/**
 * Test Yellow ClearNode Connection (Sandbox)
 * Uses raw WebSocket matching the official getting-started tutorial exactly.
 *
 * Run: bun run scripts/test-yellow-connection.ts
 */

import {
	createAuthRequestMessage,
	createECDSAMessageSigner,
	createEIP712AuthMessageSigner,
	createAuthVerifyMessageFromChallenge,
	createGetLedgerBalancesMessage,
	createGetConfigMessage,
} from "@erc7824/nitrolite";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { base } from "viem/chains";
import WebSocket from "ws";

const HOUSE_PRIVATE_KEY = process.env.HOUSE_WALLET_PRIVATE_KEY;

if (!HOUSE_PRIVATE_KEY) {
	console.error("Missing HOUSE_WALLET_PRIVATE_KEY in environment");
	process.exit(1);
}

const SANDBOX_URL = "wss://clearnet-sandbox.yellow.com/ws";
const APP_NAME = "PulseMarkets";
const AUTH_SCOPE = "console";
const SESSION_DURATION = 3600;

async function main() {
	console.log("=== Yellow ClearNode Connection Test (Sandbox) ===\n");

	const account = privateKeyToAccount(HOUSE_PRIVATE_KEY as `0x${string}`);
	console.log(`House wallet: ${account.address}`);

	const walletClient = createWalletClient({
		account,
		chain: base,
		transport: http(),
	});

	// Generate session key
	const sessionPrivateKey = generatePrivateKey();
	const sessionAccount = privateKeyToAccount(sessionPrivateKey);
	const sessionSigner = createECDSAMessageSigner(sessionPrivateKey);
	console.log(`Session key: ${sessionAccount.address}`);

	// Auth params (shared between request and verify)
	const sessionExpiry = Math.floor(Date.now() / 1000) + SESSION_DURATION;
	const authParams = {
		session_key: sessionAccount.address,
		allowances: [] as { asset: string; amount: string }[],
		expires_at: BigInt(sessionExpiry),
		scope: AUTH_SCOPE,
	};

	// Build auth request message
	const authRequestMsg = await createAuthRequestMessage({
		address: account.address,
		application: APP_NAME,
		...authParams,
	});

	console.log(`\nConnecting to: ${SANDBOX_URL}`);

	const ws = new WebSocket(SANDBOX_URL);

	let isAuthenticated = false;

	ws.on("open", () => {
		console.log("[WS] Connected");
		ws.send(authRequestMsg);
		console.log("[WS] Sent auth_request");
	});

	ws.on("message", async (data) => {
		const response = JSON.parse(data.toString());
		const type = response.res?.[1] || response.error?.method;

		console.log(`\n[WS] Received: ${type || "unknown"}`);

		if (response.error) {
			console.error("[WS] Error:", JSON.stringify(response.error, null, 2));
			return;
		}

		if (response.res?.[1] === "auth_challenge") {
			if (isAuthenticated) return;

			const challenge = response.res[2].challenge_message;
			console.log(`[Auth] Challenge: ${challenge}`);

			const eip712Signer = createEIP712AuthMessageSigner(
				walletClient,
				authParams,
				{ name: APP_NAME },
			);

			const verifyMsg = await createAuthVerifyMessageFromChallenge(
				eip712Signer,
				challenge,
			);
			ws.send(verifyMsg);
			console.log("[Auth] Sent auth_verify");
		}

		if (response.res?.[1] === "auth_verify") {
			isAuthenticated = true;
			console.log("[Auth] Authenticated successfully!");
			console.log("[Auth] Session:", JSON.stringify(response.res[2], null, 2));

			// Fetch balances
			const balanceMsg = await createGetLedgerBalancesMessage(
				sessionSigner,
				account.address,
			);
			ws.send(balanceMsg);
			console.log("[RPC] Sent get_ledger_balances");

			// Fetch config
			const configMsg = await createGetConfigMessage(sessionSigner);
			ws.send(configMsg);
			console.log("[RPC] Sent get_config");
		}

		if (response.res?.[1] === "get_ledger_balances") {
			console.log(
				"\n--- Ledger Balances ---",
				JSON.stringify(response.res[2], null, 2),
			);
		}

		if (response.res?.[1] === "get_config") {
			console.log(
				"\n--- Config ---",
				JSON.stringify(response.res[2], null, 2),
			);
		}

		if (response.res?.[1] === "channels") {
			console.log(
				"\n--- Channels ---",
				JSON.stringify(response.res[2], null, 2),
			);
		}

		if (response.res?.[1] === "balance") {
			console.log(
				"\n--- Balance Update ---",
				JSON.stringify(response.res[2], null, 2),
			);
		}
	});

	ws.on("error", (error) => {
		console.error("[WS] Error:", error.message);
		process.exit(1);
	});

	ws.on("close", () => {
		console.log("\n[WS] Disconnected");
		process.exit(0);
	});

	// Timeout after 15s
	setTimeout(() => {
		console.log(
			`\n=== Test Complete (authenticated: ${isAuthenticated}) ===`,
		);
		ws.close();
	}, 15000);
}

main().catch((error) => {
	console.error("Unhandled error:", error);
	process.exit(1);
});
