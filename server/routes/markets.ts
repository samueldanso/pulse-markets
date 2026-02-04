import { Hono } from "hono";
import { getMarketById, MARKETS } from "@/data/markets";

export const marketRoutes = new Hono();

marketRoutes.get("/", (c) => {
  return c.json({ markets: MARKETS });
});

marketRoutes.get("/:id", (c) => {
  const id = c.req.param("id");
  const market = getMarketById(id);

  if (!market) {
    return c.json({ error: "Market not found" }, 404);
  }

  return c.json({ market });
});
