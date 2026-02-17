import "server-only";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { healthRoutes } from "./routes/health";
import { destinationRoutes } from "./routes/destinations";
import { hotelRoutes } from "./routes/hotels";
import { userPreferenceRoutes } from "./routes/user-preferences";
import { tripRoutes } from "./routes/trips";
import { flightRoutes } from "./routes/flights";
import { hotelBookingRoutes } from "./routes/hotel-bookings";
import { itineraryRoutes } from "./routes/itineraries";
import { paymentRoutes } from "./routes/payments";
import { auth } from "./lib/auth";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "./errors";

const isDev = process.env.NODE_ENV !== "production";

export const app = new Elysia({ name: "api" })
  .error({
    BadRequestError,
    NotFoundError,
    ForbiddenError,
    ConflictError,
  })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "BadRequestError":
      case "NotFoundError":
      case "ForbiddenError":
      case "ConflictError":
        return status(error.status, {
          error: error.error,
          message: error.message,
          statusCode: error.status,
        });
    }
  })
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
  .use(userPreferenceRoutes)
  .use(tripRoutes)
  .use(flightRoutes)
  .use(hotelBookingRoutes)
  .use(itineraryRoutes)
  .use(paymentRoutes);

export type App = typeof app;
