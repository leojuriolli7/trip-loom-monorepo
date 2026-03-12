import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { NotFoundError } from "../errors";
import { setLogContext, setLogEntityId, useLogger } from "../lib/observability";
import {
  createFlightBookingResultSchema,
  createFlightBookingInputSchema,
  flightBookingSchema,
  flightBookingDetailSchema,
  flightOptionSchema,
  flightSearchSchema,
} from "@trip-loom/contracts/dto/flights";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import {
  cancelFlightBooking,
  createFlightBooking,
  getFlightBooking,
  listFlightBookings,
  searchFlights,
} from "../services/flights";

const tripParamsSchema = z.object({
  id: z.string().min(1),
});

const bookingParamsSchema = z.object({
  id: z.string().min(1),
  flightId: z.string().min(1),
});

export const flightRoutes = new Elysia({
  name: "flights",
  prefix: "/api",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .get(
    "/flights/search",
    async ({ query }) => {
      setLogContext(useLogger(), { search: { from: query.from, to: query.to } });

      return searchFlights(query);
    },
    {
      auth: true,
      query: flightSearchSchema,
      response: {
        200: z.array(flightOptionSchema),
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    },
  )
  .get(
    "/trips/:id/flights",
    async ({ user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await listFlightBookings(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: tripParamsSchema,
      response: {
        200: z.array(flightBookingSchema),
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/trips/:id/flights",
    async ({ set, user, params, body }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await createFlightBooking(user.id, params.id, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      setLogEntityId(log, "flightBooking", result.booking.id);
      const { existing, ...bookingResult } = result;
      set.status = existing ? 200 : 201;
      return bookingResult;
    },
    {
      auth: true,
      params: tripParamsSchema,
      body: createFlightBookingInputSchema,
      response: {
        200: createFlightBookingResultSchema,
        201: createFlightBookingResultSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .get(
    "/trips/:id/flights/:flightId",
    async ({ user, params }) => {
      const log = useLogger();

      setLogContext(log, {
        trip: { id: params.id },
        flightBooking: { id: params.flightId },
      });

      const result = await getFlightBooking(
        user.id,
        params.id,
        params.flightId,
      );
      if (!result) {
        throw new NotFoundError("Flight booking not found");
      }

      return result;
    },
    {
      auth: true,
      params: bookingParamsSchema,
      response: {
        200: flightBookingDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/trips/:id/flights/:flightId",
    async ({ set, user, params }) => {
      const log = useLogger();

      setLogContext(log, {
        trip: { id: params.id },
        flightBooking: { id: params.flightId },
      });

      const success = await cancelFlightBooking(
        user.id,
        params.id,
        params.flightId,
      );
      if (!success) {
        throw new NotFoundError("Flight booking not found");
      }

      set.status = 204;
      return new Response(null);
    },
    {
      auth: true,
      params: bookingParamsSchema,
      response: {
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
