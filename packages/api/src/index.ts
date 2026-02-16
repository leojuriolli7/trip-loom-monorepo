import "server-only";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { healthRoutes } from "./routes/health";
import { destinationRoutes } from "./routes/destinations";
import { hotelRoutes } from "./routes/hotels";
import { userPreferenceRoutes } from "./routes/user-preferences";
import { auth } from "./lib/auth";

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
  // Auth handler routes (/auth/*)
  .mount(auth.handler)
  // Routes
  .use(healthRoutes)
  .use(destinationRoutes)
  .use(hotelRoutes)
  .use(userPreferenceRoutes);

export type App = typeof app;
