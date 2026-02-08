/**
 * ERC-8004 Agent Registration Script
 *
 * One-time script to register the Pulse Markets Settlement Oracle on Base.
 * Uses agent0-sdk for the two-step flow: mint NFT → upload metadata to IPFS → set URI.
 *
 * Prerequisites:
 *   PRIVATE_KEY — wallet with Base ETH for gas
 *   PINATA_JWT  — for IPFS uploads (free tier at pinata.cloud)
 *
 * Run: bun run register-agent
 */

import { SDK } from "agent0-sdk";

const AGENT_NAME = "Pulse Markets Settlement Oracle";
const AGENT_DESCRIPTION =
  "AI-powered settlement oracle for attention prediction markets. " +
  "Determines market outcomes by analyzing real-time attention data from LunarCrush " +
  "and generates transparent AI reasoning for each settlement. " +
  "Built on Yellow Network state channels for instant, gasless betting on Base.";
const AGENT_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ethereum_Logo.png";

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set — add it to .env");
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    throw new Error("PINATA_JWT not set — get one at https://pinata.cloud");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  console.log("Initializing Agent0 SDK for Base (chain 8453)...");
  const sdk = new SDK({
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    signer: privateKey,
    ipfs: "pinata",
    pinataJwt,
    registryOverrides: {
      8453: {
        IDENTITY: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        REPUTATION: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
      },
    },
  });

  console.log("Creating agent...");
  const agent = sdk.createAgent(AGENT_NAME, AGENT_DESCRIPTION, AGENT_IMAGE);

  console.log("Configuring endpoints...");
  await agent.setA2A(`${appUrl}/api/agent/.well-known/agent-card.json`);

  agent.addSkill("advanced_reasoning_planning/strategic_planning");
  agent.addSkill("evaluation_monitoring/anomaly_detection");
  agent.addDomain("finance_and_business/investment_services");
  agent.addDomain("technology/blockchain/defi");

  agent.setTrust(true, false, false);
  agent.setActive(true);
  agent.setX402Support(false);

  console.log("Registering on-chain (minting NFT + IPFS upload)...");
  const txHandle = await agent.registerIPFS();

  console.log(`Transaction submitted: ${txHandle.hash}`);
  console.log("Waiting for confirmation...");
  await txHandle.waitMined();

  const agentId = agent.agentId;
  const agentURI = agent.agentURI;

  console.log("");
  console.log("Agent registered successfully!");
  console.log("");
  console.log("Agent ID:", agentId);
  console.log("Agent URI:", agentURI);
  console.log("");

  console.log(
    `View on 8004scan: https://www.8004scan.io/agents/base/${agentId}`,
  );
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Add AGENT_ID=${agentId} to your .env file`);
  console.log("  2. Restart the dev server");
  console.log(
    "  3. POST /api/settle/:marketId will now include agent identity proof",
  );
}

main().catch((error) => {
  console.error("Registration failed:", error.message || error);
  process.exit(1);
});
