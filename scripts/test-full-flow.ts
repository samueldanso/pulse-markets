/**
 * Test Full PulseMarkets Flow
 * Connection → Auth → App Session → Bet → Settle
 *
 * Run: bun run scripts/test-full-flow.ts
 */

import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { YellowClient } from "../lib/yellow/client";
import { CLEARNODE_URL } from "../lib/yellow/constants";
import {
  addBetToMarket,
  calculateProportionalDistribution,
  createMarketSession,
  settleMarketSession,
} from "../lib/yellow/sessions";
import type { SettlementOutcome } from "../lib/yellow/types";

const OPERATOR_PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!OPERATOR_PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY in environment");
  process.exit(1);
}

async function main() {
  console.log("=== PulseMarkets Full Flow Test ===\n");

  // Step 1: Connect + Auth
  console.log("--- Step 1: Connect & Authenticate ---");
  const account = privateKeyToAccount(OPERATOR_PRIVATE_KEY as `0x${string}`);
  console.log(`Operator wallet: ${account.address}`);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  const client = new YellowClient({ clearNodeUrl: CLEARNODE_URL });

  try {
    await client.connect(walletClient);
    console.log("PASS: Connected and authenticated\n");
  } catch (error) {
    console.error("FAIL: Connection/auth failed:", error);
    process.exit(1);
  }

  // Step 2: Check balances
  console.log("--- Step 2: Check Balances ---");
  try {
    const balances = await client.fetchLedgerBalances();
    console.log("Balances:", JSON.stringify(balances));
    console.log("PASS: Balances fetched\n");
  } catch (error) {
    console.error("FAIL: Balance fetch failed:", error);
  }

  // Step 3: Create market session (app session)
  console.log("--- Step 3: Create Market Session ---");
  const operatorAddress = account.address;
  let session;
  try {
    session = await createMarketSession(
      client,
      "test-market-1",
      operatorAddress,
      "0x0000000000000000000000000000000000000001" as `0x${string}`,
    );
    console.log(`Session ID: ${session.sessionId}`);
    console.log("PASS: Market session created\n");
  } catch (error) {
    console.error("FAIL: Market session creation failed:", error);
    console.log(
      "(This is expected if app sessions aren't supported on sandbox without channels)\n",
    );
    console.log("Continuing with local-only flow...\n");
  }

  // Step 4: Simulate bet placement (local state)
  console.log("--- Step 4: Bet Placement ---");
  const fakeUser1 = privateKeyToAccount(generatePrivateKey()).address;
  const fakeUser2 = privateKeyToAccount(generatePrivateKey()).address;

  if (session) {
    try {
      session = await addBetToMarket(client, session, {
        userAddress: fakeUser1,
        marketId: "test-market-1",
        side: "UP",
        amount: "5000000", // 5 USDC
      });
      console.log(`User1 (${fakeUser1.slice(0, 8)}...) bet UP: 5 USDC`);

      session = await addBetToMarket(client, session, {
        userAddress: fakeUser2,
        marketId: "test-market-1",
        side: "DOWN",
        amount: "3000000", // 3 USDC
      });
      console.log(`User2 (${fakeUser2.slice(0, 8)}...) bet DOWN: 3 USDC`);
      console.log("PASS: Bets placed on Yellow\n");
    } catch (error) {
      console.error("FAIL: Bet placement on Yellow failed:", error);
      console.log("Testing local calculation only...\n");
    }
  }

  // Step 5: Calculate distribution (this always works — it's pure math)
  console.log("--- Step 5: Proportional Distribution ---");
  const upPool = {
    side: "UP" as const,
    participants: [fakeUser1] as `0x${string}`[],
    amounts: [BigInt(5_000_000)],
    totalAmount: BigInt(5_000_000),
  };
  const downPool = {
    side: "DOWN" as const,
    participants: [fakeUser2] as `0x${string}`[],
    amounts: [BigInt(3_000_000)],
    totalAmount: BigInt(3_000_000),
  };

  const { distributions } = calculateProportionalDistribution(
    upPool,
    downPool,
    "UP",
  );

  for (const d of distributions) {
    console.log(
      `  ${d.participant.slice(0, 8)}... (${d.side}): stake=${d.stakeAmount}, payout=${d.payoutAmount}, profit=${d.profitPercent.toFixed(1)}%`,
    );
  }
  console.log("PASS: Distribution calculated\n");

  // Step 6: Test API endpoints
  console.log("--- Step 6: API Endpoints ---");
  console.log("Start the dev server with: bun run dev");
  console.log("Then test these:");
  console.log("  curl http://localhost:3000/api/health");
  console.log("  curl http://localhost:3000/api/markets");
  console.log("  curl http://localhost:3000/api/markets/elon-twitter-attention/pools");
  console.log(
    "  curl -X POST http://localhost:3000/api/markets/elon-twitter-attention/bet \\",
  );
  console.log('    -H "Content-Type: application/json" \\');
  console.log(
    `    -d '{"userAddress":"${fakeUser1}","side":"UP","amount":"5000000"}'`,
  );
  console.log("  curl -X POST http://localhost:3000/api/settle/elon-twitter-attention");

  // Cleanup
  await client.disconnect();
  console.log("\n=== Test Complete ===");
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
