import { Elysia } from "elysia";
import { z } from "zod";
import { NotFoundError } from "../errors";
import { setLogEntityId, useLogger } from "../lib/observability";
import {
  listDestinations,
  getDestinationById,
  getDestinationDetail,
  getRecommendedDestinations,
} from "../services/destinations";
import {
  destinationQuerySchema,
  destinationSchema,
  destinationWithStatsSchema,
  destinationDetailSchema,
  recommendedDestinationSchema,
  recommendedDestinationsQuerySchema,
} from "@trip-loom/contracts/dto/destinations";
import { errorResponseSchema, paginatedResponseSchema } from "@trip-loom/contracts/dto/common";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";

export const destinationRoutes = new Elysia({
  name: "destinations",
  prefix: "/api/destinations",
})
  .use(createDefaultRateLimit())
  .get(
    "/",
    async ({ query }) => {
      return listDestinations(query);
    },
    {
      query: destinationQuerySchema,
      response: {
        200: paginatedResponseSchema(destinationSchema),
      },
    },
  )
  .use(requireAuthMacro)
  .get(
    "/recommended",
    async ({ user, query }) => {
      return getRecommendedDestinations(user.id, query.limit);
    },
    {
      auth: true,
      query: recommendedDestinationsQuerySchema,
      response: {
        200: z.array(recommendedDestinationSchema),
        401: errorResponseSchema,
      },
    },
  )
  .get(
    "/:id",
    async ({ params }) => {
      const log = useLogger();

      setLogEntityId(log, "destination", params.id);

      const result = await getDestinationById(params.id);
      if (!result) {
        throw new NotFoundError("Destination not found");
      }
      return result;
    },
    {
      params: z.object({ id: z.string().min(1) }),
      response: {
        200: destinationWithStatsSchema,
        404: errorResponseSchema,
      },
    },
  )
  .get(
    "/:id/detail",
    async ({ params }) => {
      const log = useLogger();

      setLogEntityId(log, "destination", params.id);

      const result = await getDestinationDetail(params.id);
      if (!result) {
        throw new NotFoundError("Destination not found");
      }
      return result;
    },
    {
      params: z.object({ id: z.string().min(1) }),
      response: {
        200: destinationDetailSchema,
        404: errorResponseSchema,
      },
    },
  );
