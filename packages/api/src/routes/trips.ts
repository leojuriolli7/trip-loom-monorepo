import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema, paginatedResponseSchema } from "@trip-loom/contracts/dto/common";
import { NotFoundError } from "../errors";
import { setLogEntityId, useLogger } from "../lib/observability";
import {
  createTripInputSchema,
  tripDetailSchema,
  tripQuerySchema,
  tripWithDestinationSchema,
  updateTripInputSchema,
} from "@trip-loom/contracts/dto/trips";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
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
  .use(createDefaultRateLimit())
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
    async ({ user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await getTripById(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Trip not found");
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
    async ({ set, user, body }) => {
      const log = useLogger();

      setLogEntityId(log, "destination", body.destinationId);

      const trip = await createTrip(user.id, body);

      setLogEntityId(log, "trip", trip.id);
      set.status = 201;
      return trip;
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
    async ({ user, params, body }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await updateTrip(user.id, params.id, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
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
    async ({ set, user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const success = await deleteTrip(user.id, params.id);
      if (!success) {
        throw new NotFoundError("Trip not found");
      }
      set.status = 204;
      return new Response(null);
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
