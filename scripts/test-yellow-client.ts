/**
 * Test updated YellowClient class (using raw WebSocket)
 *
 * Run: bun run scripts/test-yellow-client.ts
 */

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { YellowClient } from "../lib/yellow/client";
import { CLEARNODE_SANDBOX_URL } from "../lib/yellow/constants";

const OPERATOR_PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!OPERATOR_PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY in environment");
  process.exit(1);
}

async function main() {
  console.log("=== YellowClient Integration Test ===\n");

  const account = privateKeyToAccount(OPERATOR_PRIVATE_KEY as `0x${string}`);
  console.log(`Operator wallet: ${account.address}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  const yellowClient = new YellowClient({
    clearNodeUrl: CLEARNODE_SANDBOX_URL,
  });

  try {
    await yellowClient.connect(walletClient);

    const status = yellowClient.getStatus();
    console.log("\n--- Status ---");
    console.log(`Connected: ${status.connected}`);
    console.log(`Authenticated: ${status.authenticated}`);
    console.log(`Session Expiry: ${status.sessionExpiry}`);

    // Wait for background balance fetch
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const balances = await yellowClient.fetchLedgerBalances();
    console.log("\n--- Balances ---");
    console.log(JSON.stringify(balances, null, 2));

    const config = await yellowClient.fetchConfig();
    console.log("\n--- Config (networks) ---");
    const networks = (
      config as { networks?: { name: string; chain_id: number }[] }
    ).networks;
    if (networks) {
      for (const n of networks) {
        console.log(`  ${n.name} (chain ${n.chain_id})`);
      }
    }

    await yellowClient.disconnect();
    console.log("\n=== Test Passed ===");
  } catch (error) {
    console.error("\nTest failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
