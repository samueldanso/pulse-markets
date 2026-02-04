import { Hono } from "hono";

export const settleRoutes = new Hono();

settleRoutes.post("/:marketId", async (c) => {
  const marketId = c.req.param("marketId");

  return c.json(
    {
      message: "Settlement not yet implemented",
      marketId,
    },
    501,
  );
});
