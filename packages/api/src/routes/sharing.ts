import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  sharedTripSchema,
  shareTripResponseSchema,
  shareTokenStatusSchema,
} from "@trip-loom/contracts/dto/sharing";
import { NotFoundError } from "../errors";
import { setLogEntityId, useLogger } from "../lib/observability";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import {
  enableTripSharing,
  disableTripSharing,
  getSharedTrip,
  getTripShareToken,
} from "../services/sharing";

const tripIdParamSchema = z.object({
  id: z.string().min(1),
});

const shareTokenParamSchema = z.object({
  shareToken: z.string().min(1),
});

/**
 * Authenticated routes for managing trip sharing (share/unshare).
 */
export const tripSharingRoutes = new Elysia({
  name: "trip-sharing",
  prefix: "/api/trips",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .get(
    "/:id/share",
    async ({ user, params }) => {
      const log = useLogger();
      setLogEntityId(log, "trip", params.id);

      const result = await getTripShareToken(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: tripIdParamSchema,
      response: {
        200: shareTokenStatusSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post(
    "/:id/share",
    async ({ user, params }) => {
      const log = useLogger();
      setLogEntityId(log, "trip", params.id);

      const result = await enableTripSharing(user.id, params.id);
      if (!result) {
        throw new NotFoundError("Trip not found");
      }

      return result;
    },
    {
      auth: true,
      params: tripIdParamSchema,
      response: {
        200: shareTripResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/:id/share",
    async ({ set, user, params }) => {
      const log = useLogger();
      setLogEntityId(log, "trip", params.id);

      const result = await disableTripSharing(user.id, params.id);
      if (result === null) {
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

/**
 * Public routes for viewing shared trips (no auth required).
 */
export const sharedTripRoutes = new Elysia({
  name: "shared-trips",
  prefix: "/api/shared",
})
  .use(createDefaultRateLimit())
  .get(
    "/:shareToken",
    async ({ params }) => {
      const result = await getSharedTrip(params.shareToken);
      if (!result) {
        throw new NotFoundError("Shared trip not found");
      }

      return result;
    },
    {
      params: shareTokenParamSchema,
      response: {
        200: sharedTripSchema,
        404: errorResponseSchema,
      },
    },
  );
