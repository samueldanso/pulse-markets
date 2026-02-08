/**
 * ERC-8004 Agent Identity Service
 * Singleton that holds agent context, provides identity proof for settlements,
 * and reads reputation from the on-chain registry.
 */

import { createPublicClient, http } from "viem";
import {
  IDENTITY_REGISTRY_ABI,
  REPUTATION_REGISTRY_ABI,
} from "@/lib/erc-8004/abis";
import {
  AGENT_CHAIN,
  AGENT_REGISTRY_ID,
  EXPLORER_BASE_URL,
  IDENTITY_REGISTRY_ADDRESS,
  REPUTATION_REGISTRY_ADDRESS,
} from "@/lib/erc-8004/constants";

interface AgentProof {
  agentId: string;
  agentRegistry: string;
  operatorAddress: string;
  registryUrl: string;
  reputation: {
    tag1: string;
    tag2: string;
    value: number;
    feedbackTxHash: string | null;
  };
}

interface AgentCard {
  name: string;
  url: string;
  version: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
}

class AgentIdentityService {
  private agentId: string | null = null;
  private operatorAddress: string | null = null;
  private publicClient = createPublicClient({
    chain: AGENT_CHAIN,
    transport: http(),
  });

  initialize(operatorAddress: string): void {
    this.operatorAddress = operatorAddress;
    this.agentId = process.env.AGENT_ID || null;

    if (this.agentId) {
      console.log(
        `[AgentIdentity] Initialized with agentId=${this.agentId}, operator=${operatorAddress}`,
      );
    } else {
      console.log(
        "[AgentIdentity] No AGENT_ID set — run `bun run register-agent` first",
      );
    }
  }

  isRegistered(): boolean {
    return this.agentId !== null;
  }

  getAgentId(): string | null {
    return this.agentId;
  }

  /**
   * Build agent identity proof for settlement responses.
   * Includes on-chain identity reference + last reputation signal.
   */
  async getAgentProof(tag1: string, tag2: string): Promise<AgentProof | null> {
    if (!this.agentId || !this.operatorAddress) return null;

    // Agent ID format is "chainId:tokenId" (e.g. "8453:2373") — extract token ID for contract calls and URLs
    const tokenId = this.agentId.includes(":")
      ? this.agentId.split(":")[1]
      : this.agentId;
    const agentIdNum = Number(tokenId);
    const registryUrl = `${EXPLORER_BASE_URL}/base/${tokenId}`;

    let reputationValue = 0;
    try {
      const [count, summaryValue] = (await this.publicClient.readContract({
        address: REPUTATION_REGISTRY_ADDRESS,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getSummary",
        args: [BigInt(agentIdNum), [], tag1, tag2],
      })) as [bigint, bigint, number];

      if (count > BigInt(0)) {
        reputationValue = Number(summaryValue);
      }
    } catch {
      // No reputation yet or contract read failed — expected for new agents
    }

    return {
      agentId: tokenId,
      agentRegistry: AGENT_REGISTRY_ID,
      operatorAddress: this.operatorAddress,
      registryUrl,
      reputation: {
        tag1,
        tag2,
        value: reputationValue,
        feedbackTxHash: null,
      },
    };
  }

  /**
   * Verify that this agent is registered on-chain by checking token ownership.
   */
  async verifyRegistration(): Promise<boolean> {
    if (!this.agentId) return false;

    try {
      const tokenId = this.agentId.includes(":")
        ? this.agentId.split(":")[1]
        : this.agentId;
      const owner = await this.publicClient.readContract({
        address: IDENTITY_REGISTRY_ADDRESS,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });
      return (
        (owner as string).toLowerCase() === this.operatorAddress?.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  /**
   * Build the A2A agent card for discovery.
   */
  getAgentCard(baseUrl: string): AgentCard {
    return {
      name: "Pulse Markets Settlement Oracle",
      url: `${baseUrl}/api/agent/a2a`,
      version: "0.3.0",
      capabilities: {
        streaming: false,
        pushNotifications: false,
      },
      skills: [
        {
          id: "settle-market",
          name: "Settle Market",
          description:
            "Settle an attention prediction market by fetching real-time data and generating AI reasoning",
        },
        {
          id: "market-info",
          name: "Market Info",
          description:
            "Get current status and pool statistics for a prediction market",
        },
      ],
      defaultInputModes: ["text"],
      defaultOutputModes: ["text"],
    };
  }
}

export const agentIdentityService = new AgentIdentityService();
