import { Elysia } from "elysia";
import { z } from "zod";
import { NotFoundError } from "../errors";
import { setLogEntityId, useLogger } from "../lib/observability";
import { listHotels, getHotelById } from "../services/hotels";
import {
  hotelQuerySchema,
  hotelSchema,
  hotelWithDestinationSchema,
} from "@trip-loom/contracts/dto/hotels";
import { errorResponseSchema, paginatedResponseSchema } from "@trip-loom/contracts/dto/common";
import { createDefaultRateLimit } from "../lib/rate-limit";

export const hotelRoutes = new Elysia({
  name: "hotels",
  prefix: "/api/hotels",
})
  .use(createDefaultRateLimit())
  .get(
    "/",
    async ({ query }) => {
      return listHotels(query);
    },
    {
      query: hotelQuerySchema,
      response: {
        200: paginatedResponseSchema(hotelSchema),
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const log = useLogger();

      setLogEntityId(log, "hotel", params.id);

      const result = await getHotelById(params.id);
      if (!result) {
        throw new NotFoundError("Hotel not found");
      }
      return result;
    },
    {
      params: z.object({ id: z.string().min(1) }),
      response: {
        200: hotelWithDestinationSchema,
        404: errorResponseSchema,
      },
    }
  );
