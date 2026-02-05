import { Hono } from "hono";

import { getMarketById, MARKETS } from "@/data/markets";
import { yellowService } from "@/server/services/yellow-service";

export const marketRoutes = new Hono();

marketRoutes.get("/", (c) => {
  const markets = MARKETS.map((m) => ({
    id: m.id,
    question: m.question,
    category: m.category,
    topic: m.topic,
    createdAt: m.createdAt,
    closesAt: m.closesAt,
    status: m.status,
    baseline: m.baseline,
    threshold: m.threshold,
    thresholdType: m.thresholdType,
    upPool: m.upPool.toString(),
    downPool: m.downPool.toString(),
    totalPot: m.totalPot.toString(),
    upParticipants: m.upParticipants.length,
    downParticipants: m.downParticipants.length,
    result: m.result,
    aiReasoning: m.aiReasoning,
    resolvedAt: m.resolvedAt,
  }));

  return c.json({ markets });
});

marketRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  const market = getMarketById(id);

  if (!market) {
    return c.json({ error: "Market not found" }, 404);
  }

  return c.json({
    market: {
      ...market,
      upPool: market.upPool.toString(),
      downPool: market.downPool.toString(),
      totalPot: market.totalPot.toString(),
      upBets: market.upBets.map((b) => b.toString()),
      downBets: market.downBets.map((b) => b.toString()),
    },
  });
});

marketRoutes.get("/:id/pools", (c) => {
  const id = c.req.param("id");

  try {
    const pools = yellowService.getMarketPools(id);
    return c.json(pools);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: msg }, 404);
  }
});

marketRoutes.post("/:id/bet", async (c) => {
  const id = c.req.param("id");

  const body = await c.req.json<{
    userAddress: string;
    side: "UP" | "DOWN";
    amount: string;
  }>();

  if (!body.userAddress || !body.side || !body.amount) {
    return c.json({ error: "Missing userAddress, side, or amount" }, 400);
  }

  if (body.side !== "UP" && body.side !== "DOWN") {
    return c.json({ error: "side must be UP or DOWN" }, 400);
  }

  const amountNum = Number(body.amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    return c.json({ error: "amount must be a positive number" }, 400);
  }

  try {
    const { market } = await yellowService.placeBet({
      marketId: id,
      userAddress: body.userAddress,
      side: body.side,
      amount: body.amount,
    });

    const pools = yellowService.getMarketPools(id);

    return c.json({
      success: true,
      bet: {
        marketId: id,
        userAddress: body.userAddress,
        side: body.side,
        amount: body.amount,
      },
      pools,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: msg }, 400);
  }
});
