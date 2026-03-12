import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { NotFoundError } from "../errors";
import { setLogContext, setLogEntityId, useLogger } from "../lib/observability";
import {
  createHotelBookingResultSchema,
  createHotelBookingInputSchema,
  hotelBookingSchema,
} from "@trip-loom/contracts/dto/hotel-bookings";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import {
  cancelHotelBooking,
  createHotelBooking,
  getHotelBooking,
  listHotelBookings,
} from "../services/hotel-bookings";

const tripParamsSchema = z.object({
  id: z.string().min(1),
});

const bookingParamsSchema = z.object({
  id: z.string().min(1),
  hotelBookingId: z.string().min(1),
});

export const hotelBookingRoutes = new Elysia({
  name: "hotel-bookings",
  prefix: "/api",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .get(
    "/trips/:id/hotels",
    async ({ user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await listHotelBookings(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: tripParamsSchema,
      response: {
        200: z.array(hotelBookingSchema),
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/trips/:id/hotels",
    async ({ set, user, params, body }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await createHotelBooking(user.id, params.id, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      setLogEntityId(log, "hotelBooking", result.booking.id);
      const { existing, ...bookingResult } = result;
      set.status = existing ? 200 : 201;
      return bookingResult;
    },
    {
      auth: true,
      params: tripParamsSchema,
      body: createHotelBookingInputSchema,
      response: {
        200: createHotelBookingResultSchema,
        201: createHotelBookingResultSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .get(
    "/trips/:id/hotels/:hotelBookingId",
    async ({ user, params }) => {
      const log = useLogger();

      setLogContext(log, {
        trip: { id: params.id },
        hotelBooking: { id: params.hotelBookingId },
      });

      const result = await getHotelBooking(
        user.id,
        params.id,
        params.hotelBookingId,
      );
      if (!result) {
        throw new NotFoundError("Hotel booking not found");
      }

      return result;
    },
    {
      auth: true,
      params: bookingParamsSchema,
      response: {
        200: hotelBookingSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/trips/:id/hotels/:hotelBookingId",
    async ({ set, user, params }) => {
      const log = useLogger();

      setLogContext(log, {
        trip: { id: params.id },
        hotelBooking: { id: params.hotelBookingId },
      });

      const success = await cancelHotelBooking(
        user.id,
        params.id,
        params.hotelBookingId,
      );
      if (!success) {
        throw new NotFoundError("Hotel booking not found");
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
