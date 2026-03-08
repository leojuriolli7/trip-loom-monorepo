import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createOtelPlugin, type OtelPluginOptions } from "./lib/otel/plugin";
import { createWideEventPlugin } from "./lib/wide-events";
import { healthRoutes } from "./routes/health";
import { destinationRoutes } from "./routes/destinations";
import { hotelRoutes } from "./routes/hotels";
import { userPreferenceRoutes } from "./routes/user-preferences";
import { tripRoutes } from "./routes/trips";
import { flightRoutes } from "./routes/flights";
import { hotelBookingRoutes } from "./routes/hotel-bookings";
import { itineraryRoutes } from "./routes/itineraries";
import { paymentRoutes } from "./routes/payments";
import { chatRoutes } from "./routes/chat";
import { suggestionsRoutes } from "./routes/suggestions";
import { auth } from "./lib/auth";
import {
  BadRequestError,
  BookingNotPayableError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentAlreadySuccessfulError,
  PaymentProcessingError,
} from "./errors";
import { initPersistence } from "@trip-loom/agents";

const isDev = process.env.NODE_ENV !== "production";

type AppConfig = OtelPluginOptions;

export const createApp = (options?: AppConfig) =>
  new Elysia({ name: "api" })
    .error({
      BadRequestError,
      BookingNotPayableError,
      NotFoundError,
      ForbiddenError,
      ConflictError,
      PaymentAlreadySuccessfulError,
      PaymentProcessingError,
    })
    .onError(({ code, error, status }) => {
      switch (code) {
        case "BadRequestError":
        case "BookingNotPayableError":
        case "NotFoundError":
        case "ForbiddenError":
        case "ConflictError":
        case "PaymentAlreadySuccessfulError":
        case "PaymentProcessingError":
          return status(error.status, {
            error: error.name,
            message: error.message,
            statusCode: error.status,
          });
      }
    })
    // OpenTelemetry tracing + log export (must be before wide events)
    .use(createOtelPlugin(options))
    // Wide event structured logging (1 log per request)
    .use(createWideEventPlugin({ service: options?.serviceName }))
    // CORS - configured for dev/prod
    .use(
      cors({
        origin: isDev
          ? [
              "http://localhost:3000",
              "http://127.0.0.1:3000",
              "http://localhost:3001",
              "http://127.0.0.1:3001",
            ]
          : (process.env.CORS_ORIGINS?.split(",") ?? []),
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )
    // OAuth 2.1 discovery — RFC 8414 requires well-known at the root level, but
    // Better Auth serves it under /auth/. We proxy both the plain path and the
    // RFC 8414 §3 path-based variant (/.well-known/oauth-authorization-server/auth)
    // so MCP clients like mcp-remote can discover the authorization server.
    .get("/.well-known/oauth-authorization-server/*", async ({ request }) => {
      const url = new URL(
        "/auth/.well-known/oauth-authorization-server",
        request.url,
      );
      const response = await fetch(url);
      return response.json();
    })
    .get("/.well-known/oauth-authorization-server", async ({ request }) => {
      const url = new URL(
        "/auth/.well-known/oauth-authorization-server",
        request.url,
      );
      const response = await fetch(url);
      return response.json();
    })
    // Initialize LangGraph persistence (checkpointer + store tables)
    .onStart(async () => {
      if (process.env.DATABASE_URL) {
        await initPersistence(process.env.DATABASE_URL);
        console.log("LangGraph persistence initialized");
      }
    })
    // Auth handler routes (/auth/*)
    .mount(auth.handler)
    // Routes
    .use(healthRoutes)
    .use(destinationRoutes)
    .use(hotelRoutes)
    .use(userPreferenceRoutes)
    .use(tripRoutes)
    .use(flightRoutes)
    .use(hotelBookingRoutes)
    .use(itineraryRoutes)
    .use(paymentRoutes)
    .use(chatRoutes)
    .use(suggestionsRoutes);

export type App = ReturnType<typeof createApp>;
