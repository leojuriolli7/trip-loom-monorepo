import "server-only";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";

const isDev = process.env.NODE_ENV !== "production";

export const app = new Elysia({ name: "api" })
  // CORS - configured for dev/prod
  .use(
    cors({
      origin: isDev
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : (process.env.CORS_ORIGINS?.split(",") ?? []),
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  // Routes
  .use(authRoutes)
  .use(healthRoutes);

export type App = typeof app;
