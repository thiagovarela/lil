import { join } from "node:path";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth.ts";
import { createApiRoutes } from "./routes/api.ts";
import { createWebSocketHandler, upgradeWebSocket } from "./routes/ws.ts";
import { serveStatic } from "./static.ts";
import type { WebServerDeps } from "./types.ts";

const WEB_DIST_DIR = join(import.meta.dir, "../../dist/client");

export function createWebApp(deps: WebServerDeps, lilDir: string) {
	const app = new Hono();

	// WebSocket upgrade (must come before auth middleware for Bun's upgrade to work)
	app.get("/ws", (c) => {
		// Auth check happens in the upgrade handler
		const authToken = c.req.header("authorization")?.substring(7).trim() || c.req.query("token");
		if (authToken !== deps.token) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		return upgradeWebSocket(c, deps);
	});

	// API routes (authenticated)
	app.route("/api", authMiddleware(deps.token));
	app.route("/api", createApiRoutes(lilDir));

	// Static file serving (unauthenticated — auth happens via cookie on first visit)
	app.get("*", (c) => {
		return serveStatic(c, WEB_DIST_DIR, deps.token);
	});

	return app;
}

export { createWebSocketHandler };
export type { WebServerDeps, WsClientData } from "./types.ts";
