import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  createHotelBookingInputSchema,
  hotelBookingSchema,
} from "@trip-loom/contracts/dto/hotel-bookings";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
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
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .get(
    "/trips/:id/hotels",
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await listHotelBookings(user.id, params.id);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Trip not found",
          statusCode: 404,
        });
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
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await createHotelBooking(user.id, params.id, body);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      wideEvent.hotel_booking_id = result.id;
      return status(201, result);
    },
    {
      auth: true,
      params: tripParamsSchema,
      body: createHotelBookingInputSchema,
      response: {
        201: hotelBookingSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .get(
    "/trips/:id/hotels/:hotelBookingId",
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.hotel_booking_id = params.hotelBookingId;

      const result = await getHotelBooking(
        user.id,
        params.id,
        params.hotelBookingId,
      );
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Hotel booking not found",
          statusCode: 404,
        });
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
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.hotel_booking_id = params.hotelBookingId;

      const success = await cancelHotelBooking(
        user.id,
        params.id,
        params.hotelBookingId,
      );
      if (!success) {
        return status(404, {
          error: "NotFound",
          message: "Hotel booking not found",
          statusCode: 404,
        });
      }

      return new Response(null, { status: 204 });
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
