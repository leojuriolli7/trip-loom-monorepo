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
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth-plugin";
import {
  cancelFlightBooking,
  createFlightBooking,
  getFlightBooking,
  listFlightBookings,
  searchFlights,
  updateFlightBooking,
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
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .get(
    "/flights/search",
    async ({ query, wideEvent }) => {
      wideEvent.search = {
        from: query.from,
        to: query.to,
      };

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
    async ({ user, params, status, wideEvent }) => {

      wideEvent.trip_id = params.id;

      const result = await listFlightBookings(user.id, params.id);
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
    async ({ user, params, body, status, wideEvent }) => {

      wideEvent.trip_id = params.id;

      const result = await createFlightBooking(user.id, params.id, body);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      wideEvent.flight_booking_id = result.id;
      return status(201, result);
    },
    {
      auth: true,
      params: tripParamsSchema,
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
    "/trips/:id/flights/:flightId",
    async ({ user, params, status, wideEvent }) => {

      wideEvent.trip_id = params.id;
      wideEvent.flight_booking_id = params.flightId;

      const result = await getFlightBooking(user.id, params.id, params.flightId);
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
    "/trips/:id/flights/:flightId",
    async ({ user, params, body, status, wideEvent }) => {

      wideEvent.trip_id = params.id;
      wideEvent.flight_booking_id = params.flightId;

      const result = await updateFlightBooking(
        user.id,
        params.id,
        params.flightId,
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
    "/trips/:id/flights/:flightId",
    async ({ user, params, status, wideEvent }) => {

      wideEvent.trip_id = params.id;
      wideEvent.flight_booking_id = params.flightId;

      const success = await cancelFlightBooking(user.id, params.id, params.flightId);
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
