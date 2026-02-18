import { Elysia } from "elysia";
import { z } from "zod";
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
} from "../dto/destinations";
import { errorResponseSchema, paginatedResponseSchema } from "../dto/common";
import { requireAuthMacro } from "../lib/auth-plugin";

export const destinationRoutes = new Elysia({
  name: "destinations",
  prefix: "/api/destinations",
})
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
    }
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
    }
  )
  .get(
    "/:id",
    async ({ params, status }) => {
      const result = await getDestinationById(params.id);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Destination not found",
          statusCode: 404,
        });
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
    async ({ params, status }) => {
      const result = await getDestinationDetail(params.id);
      if (!result) {
        return status(404, {
          error: "Not Found",
          message: "Destination not found",
          statusCode: 404,
        });
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
