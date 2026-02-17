import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "../dto/common";
import {
  createFlightBookingInputSchema,
  flightBookingSchema,
  flightBookingDetailSchema,
  flightOptionSchema,
  flightSearchSchema,
  updateFlightBookingInputSchema,
} from "../dto/flights";
import { requireAuthMacro } from "../lib/auth-plugin";
import {
  cancelFlightBooking,
  createFlightBooking,
  getFlightBooking,
  listFlightBookings,
  searchFlights,
  updateFlightBooking,
} from "../services/flights";

const tripIdParamsSchema = z.object({
  tripId: z.string().min(1),
});

const bookingParamsSchema = z.object({
  tripId: z.string().min(1),
  id: z.string().min(1),
});

export const flightRoutes = new Elysia({
  name: "flights",
})
  .use(requireAuthMacro)
  .get(
    "/api/flights/search",
    async ({ query }) => {
      return searchFlights(query);
    },
    {
      query: flightSearchSchema,
      response: {
        200: z.array(flightOptionSchema),
        400: errorResponseSchema,
      },
    },
  )
  .get(
    "/api/trips/:tripId/flights",
    async ({ user, params, status }) => {
      const result = await listFlightBookings(user.id, params.tripId);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      return result;
    },
    {
      auth: true,
      params: tripIdParamsSchema,
      response: {
        200: z.array(flightBookingSchema),
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/api/trips/:tripId/flights",
    async ({ user, params, body, status }) => {
      const result = await createFlightBooking(user.id, params.tripId, body);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      return status(201, result);
    },
    {
      auth: true,
      params: tripIdParamsSchema,
      body: createFlightBookingInputSchema,
      response: {
        201: flightBookingSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .get(
    "/api/trips/:tripId/flights/:id",
    async ({ user, params, status }) => {
      const result = await getFlightBooking(user.id, params.tripId, params.id);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Flight booking not found",
          statusCode: 404,
        });
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
  .patch(
    "/api/trips/:tripId/flights/:id",
    async ({ user, params, body, status }) => {
      const result = await updateFlightBooking(
        user.id,
        params.tripId,
        params.id,
        body,
      );

      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Flight booking not found",
          statusCode: 404,
        });
      }

      return result;
    },
    {
      auth: true,
      params: bookingParamsSchema,
      body: updateFlightBookingInputSchema,
      response: {
        200: flightBookingSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/api/trips/:tripId/flights/:id",
    async ({ user, params, status }) => {
      const success = await cancelFlightBooking(user.id, params.tripId, params.id);
      if (!success) {
        return status(404, {
          error: "Not Found",
          message: "Flight booking not found",
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
