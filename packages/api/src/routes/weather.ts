import { Elysia } from "elysia";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  weatherRequestQuerySchema,
  weatherResponseSchema,
} from "@trip-loom/contracts/dto/weather";
import { createWideEventPlugin } from "../lib/wide-events";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import { getWeatherForecast } from "../services/weather";

export const weatherRoutes = new Elysia({
  name: "weather",
  prefix: "/api/weather",
})
  .use(createDefaultRateLimit())
  .use(createWideEventPlugin())
  .use(requireAuthMacro)
  .get(
    "/forecast",
    async ({ query, wideEvent }) => {
      wideEvent.provider = "open-meteo";
      wideEvent.destination_query = query.city;

      return getWeatherForecast(query);
    },
    {
      auth: true,
      query: weatherRequestQuerySchema,
      response: {
        200: weatherResponseSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        429: errorResponseSchema,
      },
    },
  );
