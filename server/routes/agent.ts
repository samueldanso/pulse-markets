/**
 * ERC-8004 Agent Discovery & A2A Routes
 * Mounted at /api/agent in the Hono app.
 *
 * Endpoints:
 * - GET  /.well-known/agent-card.json → Agent card discovery
 * - POST /a2a                         → JSON-RPC 2.0 for agent-to-agent messaging
 */

import { Hono } from "hono";

import { getMarketById, MARKETS } from "@/data/markets";
import { agentIdentityService } from "@/server/services/agent-identity";
import { yellowService } from "@/server/services/yellow-service";

export const agentRoutes = new Hono();

agentRoutes.get("/.well-known/agent-card.json", (c) => {
  const origin = new URL(c.req.url).origin;
  const card = agentIdentityService.getAgentCard(origin);
  return c.json(card);
});

agentRoutes.post("/a2a", async (c) => {
  const body = await c.req.json<{
    jsonrpc: string;
    method: string;
    params?: Record<string, unknown>;
    id?: string | number;
  }>();

  if (body.jsonrpc !== "2.0") {
    return c.json(
      {
        jsonrpc: "2.0",
        error: { code: -32600, message: "Invalid Request" },
        id: body.id,
      },
      400,
    );
  }

  try {
    const result = await handleMethod(body.method, body.params ?? {});
    return c.json({ jsonrpc: "2.0", result, id: body.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return c.json(
      { jsonrpc: "2.0", error: { code: -32603, message: msg }, id: body.id },
      500,
    );
  }
});

async function handleMethod(
  method: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  switch (method) {
    case "message/send":
      return handleMessageSend(params);
    case "tasks/get":
      return { error: "tasks/get not implemented — stateless agent" };
    default:
      throw new Error(`Method not found: ${method}`);
  }
}

async function handleMessageSend(
  params: Record<string, unknown>,
): Promise<unknown> {
  const message = params.message as
    | {
        role: string;
        parts: Array<{ type: string; text?: string }>;
      }
    | undefined;

  if (!message?.parts) {
    throw new Error("Missing message.parts");
  }

  const userText = message.parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("\n")
    .toLowerCase();

  if (userText.includes("settle") || userText.includes("settlement")) {
    return handleSettleSkill(userText);
  }

  if (
    userText.includes("market") ||
    userText.includes("info") ||
    userText.includes("status")
  ) {
    return handleMarketInfoSkill(userText);
  }

  return {
    status: "completed",
    messages: [
      {
        role: "agent",
        parts: [
          {
            type: "text",
            text: "I'm the Pulse Markets Settlement Oracle. I can settle-market or provide market-info. What would you like?",
          },
        ],
      },
    ],
  };
}

async function handleSettleSkill(text: string): Promise<unknown> {
  const marketId = extractMarketId(text);
  if (!marketId) {
    return agentResponse(
      `Available markets: ${MARKETS.map((m) => `${m.id} (${m.topic})`).join(", ")}. Specify a market ID to settle.`,
    );
  }

  const market = getMarketById(marketId);
  if (!market) return agentResponse(`Market ${marketId} not found.`);
  if (market.status === "closed") {
    return agentResponse(
      `Market ${marketId} already settled. Winner: ${market.result}. Reasoning: ${market.aiReasoning}`,
    );
  }

  return agentResponse(
    `Market ${marketId} (${market.question}) is ${market.status}. ` +
      `Pools: UP=${market.upPool.toString()} / DOWN=${market.downPool.toString()}. ` +
      `To settle, POST /api/settle/${marketId}`,
  );
}

async function handleMarketInfoSkill(text: string): Promise<unknown> {
  const marketId = extractMarketId(text);

  if (!marketId) {
    const summaries = MARKETS.map((m) => {
      const pools = yellowService.getMarketPools(m.id);
      return `• ${m.id}: ${m.question} [${m.status}] UP=${pools.upPercentage}% DOWN=${pools.downPercentage}%`;
    });
    return agentResponse(`Active markets:\n${summaries.join("\n")}`);
  }

  const market = getMarketById(marketId);
  if (!market) return agentResponse(`Market ${marketId} not found.`);

  const pools = yellowService.getMarketPools(marketId);
  return agentResponse(
    `${market.question}\n` +
      `Status: ${market.status}\n` +
      `UP: ${pools.upPool} USDC (${pools.upPercentage}%) — ${pools.upParticipants} bettors\n` +
      `DOWN: ${pools.downPool} USDC (${pools.downPercentage}%) — ${pools.downParticipants} bettors\n` +
      `Total pot: ${pools.totalPot} USDC`,
  );
}

function extractMarketId(text: string): string | null {
  for (const market of MARKETS) {
    if (text.includes(market.id)) return market.id;
  }
  return null;
}

function agentResponse(text: string) {
  return {
    status: "completed",
    messages: [{ role: "agent", parts: [{ type: "text", text }] }],
  };
}
