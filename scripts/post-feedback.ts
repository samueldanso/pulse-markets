/**
 * ERC-8004 Reputation Feedback Demo Script
 *
 * Posts on-chain reputation feedback for the Pulse Markets settlement agent.
 * Per spec, feedback submitter cannot be the agent owner (anti-self-review).
 * This script should be run from a DIFFERENT wallet than the agent operator.
 *
 * Prerequisites:
 *   FEEDBACK_PRIVATE_KEY — wallet that is NOT the agent owner (with Base ETH for gas)
 *   AGENT_ID             — the registered agent's token ID
 *
 * Run: bun run post-feedback
 */

import { SDK } from "agent0-sdk";

async function main() {
  const privateKey = process.env.FEEDBACK_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "FEEDBACK_PRIVATE_KEY not set — must be a different wallet than the agent owner",
    );
  }

  const agentId = process.env.AGENT_ID;
  if (!agentId) {
    throw new Error("AGENT_ID not set — run `bun run register-agent` first");
  }

  console.log("Initializing Agent0 SDK for Base (chain 8453)...");
  const sdk = new SDK({
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    signer: privateKey,
    registryOverrides: {
      8453: {
        IDENTITY: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        REPUTATION: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
      },
    },
  });

  console.log(`Posting feedback for agent ${agentId}...`);

  const txHandle = await sdk.giveFeedback(
    agentId,
    95,
    "settlement",
    "btc-sentiment",
    "/api/settle/btc-attention",
  );

  console.log(`Transaction submitted: ${txHandle.hash}`);
  console.log("Waiting for confirmation...");
  const { receipt } = await txHandle.waitMined();

  console.log("");
  console.log("Feedback posted successfully!");
  console.log("");
  console.log("Tx hash:", txHandle.hash);
  console.log("Block:", receipt.blockNumber);
  console.log("Agent ID:", agentId);
  console.log("Value: 95 (settlement quality score)");
  console.log("Tags: settlement / btc-sentiment");
  console.log("");
  console.log(
    `View on 8004scan: https://www.8004scan.io/agents/base/${agentId}`,
  );
}

main().catch((error) => {
  console.error("Feedback posting failed:", error.message || error);
  process.exit(1);
});
