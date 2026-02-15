import "server-only";
import { Elysia } from "elysia";

export const app = new Elysia({ prefix: "/api" }).get("/health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

export type App = typeof app;
