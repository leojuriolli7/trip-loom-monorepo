import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  createActivityInputSchema,
  createDayInputSchema,
  createItineraryInputSchema,
  itineraryDetailSchema,
  updateActivityInputSchema,
  updateDayInputSchema,
} from "@trip-loom/contracts/dto/itineraries";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
import {
  addActivity,
  addDay,
  createItinerary,
  deleteActivity,
  deleteDay,
  deleteItinerary,
  getItinerary,
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
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  // ==========================================================================
  // Itinerary Level
  // ==========================================================================
  .get(
    "/trips/:id/itinerary",
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await getItinerary(user.id, params.id);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Itinerary not found",
          statusCode: 404,
        });
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
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await createItinerary(user.id, params.id, body);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      return status(201, result);
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
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const success = await deleteItinerary(user.id, params.id);
      if (!success) {
        return status(404, {
          error: "NotFound",
          message: "Itinerary not found",
          statusCode: 404,
        });
      }

      return new Response(null, { status: 204 });
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
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;

      const result = await addDay(user.id, params.id, body);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      return status(201, result);
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
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.day_id = params.dayId;

      const result = await updateDay(user.id, params.id, params.dayId, body);
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
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.day_id = params.dayId;

      const result = await deleteDay(user.id, params.id, params.dayId);
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
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.day_id = params.dayId;

      const result = await addActivity(user.id, params.id, params.dayId, body);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Trip not found",
          statusCode: 404,
        });
      }

      return status(201, result);
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
    async ({ user, params, body, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.day_id = params.dayId;
      wideEvent.activity_id = params.activityId;

      const result = await updateActivity(
        user.id,
        params.id,
        params.dayId,
        params.activityId,
        body,
      );
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
    async ({ user, params, status, wideEvent }) => {
      wideEvent.trip_id = params.id;
      wideEvent.day_id = params.dayId;
      wideEvent.activity_id = params.activityId;

      const result = await deleteActivity(
        user.id,
        params.id,
        params.dayId,
        params.activityId,
      );
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
      params: activityParamsSchema,
      response: {
        200: itineraryDetailSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
