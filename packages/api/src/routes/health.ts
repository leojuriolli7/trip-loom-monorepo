import { Elysia } from "elysia";

/**
 * Health check endpoint.
 * GET /api/health
 */
export const healthRoutes = new Elysia({ name: "health", prefix: "/api" }).get(
  "/health",
  () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);
