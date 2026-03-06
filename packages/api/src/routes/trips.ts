import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema, paginatedResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  createTripInputSchema,
  tripDetailSchema,
  tripQuerySchema,
  tripWithDestinationSchema,
  updateTripInputSchema,
} from "@trip-loom/contracts/dto/trips";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
import {
  createTrip,
  deleteTrip,
  getTripById,
  listTrips,
  updateTrip,
} from "../services/trips";

const tripIdParamSchema = z.object({
  id: z.string().min(1),
});

export const tripRoutes = new Elysia({
  name: "trips",
  prefix: "/api/trips",
})
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .get(
    "/",
    async ({ user, query }) => {
      return listTrips(user.id, query);
    },
    {
      auth: true,
      query: tripQuerySchema,
      response: {
        200: paginatedResponseSchema(tripWithDestinationSchema),
        401: errorResponseSchema,
      },
    },
  )
  .get(
    "/:id",
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await getTripById(user.id, params.id);
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
      params: tripIdParamSchema,
      response: {
        200: tripDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/",
    async ({ user, body, status, wideEvent }) => {
      wideEvent.destination_id = body.destinationId;

      const trip = await createTrip(user.id, body);

      wideEvent.trip_id = trip.id;
      return status(201, trip);
    },
    {
      auth: true,
      body: createTripInputSchema,
      response: {
        201: tripWithDestinationSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
      },
    },
  )
  .patch(
    "/:id",
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await updateTrip(user.id, params.id, body);
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
      params: tripIdParamSchema,
      body: updateTripInputSchema,
      response: {
        200: tripWithDestinationSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/:id",
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const success = await deleteTrip(user.id, params.id);
      if (!success) {
        return status(404, {
          error: "NotFound",
          message: "Trip not found",
          statusCode: 404,
        });
      }
      return new Response(null, { status: 204 });
    },
    {
      auth: true,
      params: tripIdParamSchema,
      response: {
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
