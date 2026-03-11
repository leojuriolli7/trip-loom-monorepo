import { Elysia } from "elysia";
import { createDefaultRateLimit } from "../lib/rate-limit";

/**
 * Health check endpoint.
 * GET /api/health
 */
export const healthRoutes = new Elysia({ name: "health", prefix: "/api" })
  .use(createDefaultRateLimit())
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));
