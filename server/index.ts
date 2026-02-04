import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { marketRoutes } from "./routes/markets";
import { settleRoutes } from "./routes/settle";
import { yellowService } from "./services/yellow-service";

const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

app.route("/markets", marketRoutes);
app.route("/settle", settleRoutes);

app.get("/health", (c) =>
	c.json({
		status: "ok",
		timestamp: Date.now(),
		yellow: yellowService.getStatus(),
	}),
);

export default app;
