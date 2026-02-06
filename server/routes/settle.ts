import { Hono } from "hono";

import { getMarketById } from "@/data/markets";
import { agentIdentityService } from "@/server/services/agent-identity";
import { getAttentionValue } from "@/server/services/attention";
import { settleMarket } from "@/server/services/settlement";
import { yellowService } from "@/server/services/yellow-service";

export const settleRoutes = new Hono();

settleRoutes.post("/:marketId", async (c) => {
  const marketId = c.req.param("marketId");

  const market = getMarketById(marketId);
  if (!market) {
    return c.json({ error: "Market not found" }, 404);
  }

  if (market.status === "closed") {
    return c.json(
      {
        error: "Market already settled",
        result: market.result,
        reasoning: market.aiReasoning,
      },
      400,
    );
  }

  try {
    // 1. Fetch attention data
    const attention = await getAttentionValue(market.topic, market.baseline);

    // 2. Determine winner + AI reasoning
    const settlement = await settleMarket({
      market,
      currentValue: attention.current,
      dataSource: attention.source,
    });

    // 3. Settle on Yellow Network + update market state
    const { distributions } = await yellowService.settleMarket(
      marketId,
      settlement.winner,
      settlement.reasoning,
      settlement.attentionData,
    );

    const agentProof = await agentIdentityService.getAgentProof(
      "settlement",
      market.topic,
    );

    return c.json({
      success: true,
      marketId,
      winner: settlement.winner,
      reasoning: settlement.reasoning,
      attentionData: settlement.attentionData,
      confidence: settlement.confidence,
      dataSource: attention.source,
      distributions: distributions.map((d) => ({
        participant: d.participant,
        side: d.side,
        stake: d.stakeAmount.toString(),
        payout: d.payoutAmount.toString(),
        profitPercent: d.profitPercent,
      })),
      agent: agentProof,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Settle] Error settling ${marketId}:`, error);
    return c.json({ error: msg }, 500);
  }
});
