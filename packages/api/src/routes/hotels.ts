import { Elysia } from "elysia";
import { z } from "zod";
import { listHotels, getHotelById } from "../services/hotels";
import {
  hotelQuerySchema,
  hotelSchema,
  hotelWithDestinationSchema,
} from "@trip-loom/contracts/dto/hotels";
import { errorResponseSchema, paginatedResponseSchema } from "@trip-loom/contracts/dto/common";
import { createWideEventPlugin } from "../lib/wide-events";
import { createDefaultRateLimit } from "../lib/rate-limit";

export const hotelRoutes = new Elysia({
  name: "hotels",
  prefix: "/api/hotels",
})
  .use(createDefaultRateLimit())
  .use(createWideEventPlugin())
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
    async ({ params, status, wideEvent }) => {
      wideEvent.hotel_id = params.id;

      const result = await getHotelById(params.id);
      if (!result) {
        return status(404, {
          error: "NotFound",
          message: "Hotel not found",
          statusCode: 404,
        });
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
