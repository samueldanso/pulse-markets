import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { agentRoutes } from "./routes/agent";
import { marketRoutes } from "./routes/markets";
import { settleRoutes } from "./routes/settle";
import { yellowRoutes } from "./routes/yellow";
import { agentIdentityService } from "./services/agent-identity";
import { yellowService } from "./services/yellow-service";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

app.route("/markets", marketRoutes);
app.route("/settle", settleRoutes);
app.route("/agent", agentRoutes);
app.route("/yellow", yellowRoutes);

// Initialize agent identity with operator wallet
const operatorAddress = process.env.WALLET_ADDRESS;
if (operatorAddress) {
  agentIdentityService.initialize(operatorAddress);
}

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: Date.now(),
    yellow: yellowService.getStatus(),
    agent: {
      registered: agentIdentityService.isRegistered(),
      agentId: agentIdentityService.getAgentId(),
    },
  }),
);

export default app;
