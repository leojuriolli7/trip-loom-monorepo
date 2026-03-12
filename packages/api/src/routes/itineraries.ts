import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { NotFoundError } from "../errors";
import { setLogContext, setLogEntityId, useLogger } from "../lib/observability";
import {
  createActivityInputSchema,
  createDayInputSchema,
  createItineraryInputSchema,
  itineraryDetailSchema,
  itineraryWithTripSchema,
  updateActivityInputSchema,
  updateDayInputSchema,
} from "@trip-loom/contracts/dto/itineraries";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import {
  addActivity,
  addDay,
  createItinerary,
  deleteActivity,
  deleteDay,
  deleteItinerary,
  getItinerary,
  listUserItineraries,
  updateActivity,
  updateDay,
} from "../services/itineraries";

const tripParamsSchema = z.object({
  id: z.string().min(1),
});

const dayParamsSchema = z.object({
  id: z.string().min(1),
  dayId: z.string().min(1),
});

const activityParamsSchema = z.object({
  id: z.string().min(1),
  dayId: z.string().min(1),
  activityId: z.string().min(1),
});

export const itineraryRoutes = new Elysia({
  name: "itineraries",
  prefix: "/api",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  // ==========================================================================
  // User-level: list all itineraries across trips
  // ==========================================================================
  .get(
    "/trips/itineraries",
    async ({ user, query }) => {
      return listUserItineraries(user.id, query.limit);
    },
    {
      auth: true,
      query: z.object({
        limit: z.coerce.number().min(1).max(100).default(20),
      }),
      response: {
        200: z.array(itineraryWithTripSchema),
        401: errorResponseSchema,
      },
    },
  )
  // ==========================================================================
  // Itinerary Level
  // ==========================================================================
  .get(
    "/trips/:id/itinerary",
    async ({ user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await getItinerary(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Itinerary not found");
      }

      return result;
    },
    {
      auth: true,
      params: tripParamsSchema,
      response: {
        200: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/trips/:id/itinerary",
    async ({ set, user, params, body }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await createItinerary(user.id, params.id, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      set.status = 201;
      return result;
    },
    {
      auth: true,
      params: tripParamsSchema,
      body: createItineraryInputSchema,
      response: {
        201: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        409: errorResponseSchema,
      },
    },
  )
  .delete(
    "/trips/:id/itinerary",
    async ({ set, user, params }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const success = await deleteItinerary(user.id, params.id);
      if (!success) {
        throw new NotFoundError("Itinerary not found");
      }

      set.status = 204;
      return new Response(null);
    },
    {
      auth: true,
      params: tripParamsSchema,
      response: {
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  // ==========================================================================
  // Day Level
  // ==========================================================================
  .post(
    "/trips/:id/itinerary/days",
    async ({ set, user, params, body }) => {
      const log = useLogger();

      setLogEntityId(log, "trip", params.id);

      const result = await addDay(user.id, params.id, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      set.status = 201;
      return result;
    },
    {
      auth: true,
      params: tripParamsSchema,
      body: createDayInputSchema,
      response: {
        201: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .patch(
    "/trips/:id/itinerary/days/:dayId",
    async ({ user, params, body }) => {
      const log = useLogger();

      setLogContext(log, { trip: { id: params.id }, day: { id: params.dayId } });

      const result = await updateDay(user.id, params.id, params.dayId, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: dayParamsSchema,
      body: updateDayInputSchema,
      response: {
        200: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/trips/:id/itinerary/days/:dayId",
    async ({ user, params }) => {
      const log = useLogger();

      setLogContext(log, { trip: { id: params.id }, day: { id: params.dayId } });

      const result = await deleteDay(user.id, params.id, params.dayId);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: dayParamsSchema,
      response: {
        200: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  // ==========================================================================
  // Activity Level
  // ==========================================================================
  .post(
    "/trips/:id/itinerary/days/:dayId/activities",
    async ({ set, user, params, body }) => {
      const log = useLogger();

      setLogContext(log, { trip: { id: params.id }, day: { id: params.dayId } });

      const result = await addActivity(user.id, params.id, params.dayId, body);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      set.status = 201;
      return result;
    },
    {
      auth: true,
      params: dayParamsSchema,
      body: createActivityInputSchema,
      response: {
        201: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .patch(
    "/trips/:id/itinerary/days/:dayId/activities/:activityId",
    async ({ user, params, body }) => {
      const log = useLogger();

      setLogContext(log, {
        trip: { id: params.id },
        day: { id: params.dayId },
        activity: { id: params.activityId },
      });

      const result = await updateActivity(
        user.id,
        params.id,
        params.dayId,
        params.activityId,
        body,
      );
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: activityParamsSchema,
      body: updateActivityInputSchema,
      response: {
        200: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/trips/:id/itinerary/days/:dayId/activities/:activityId",
    async ({ user, params }) => {
      const log = useLogger();

      setLogContext(log, {
        trip: { id: params.id },
        day: { id: params.dayId },
        activity: { id: params.activityId },
      });

      const result = await deleteActivity(
        user.id,
        params.id,
        params.dayId,
        params.activityId,
      );
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: activityParamsSchema,
      response: {
        200: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
