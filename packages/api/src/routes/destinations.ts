import { Elysia } from "elysia";
import { z } from "zod";
import {
  listDestinations,
  getDestinationById,
} from "../services/destinations";
import {
  destinationQuerySchema,
  destinationSchema,
  destinationWithStatsSchema,
} from "../dto/destinations";
import { errorResponseSchema, paginatedResponseSchema } from "../dto/common";

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
    }
  );
