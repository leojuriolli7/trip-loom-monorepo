import { Elysia } from "elysia";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { setLogContext, useLogger } from "../lib/observability";
import {
  weatherRequestQuerySchema,
  weatherResponseSchema,
} from "@trip-loom/contracts/dto/weather";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import { getWeatherForecast } from "../services/weather";

export const weatherRoutes = new Elysia({
  name: "weather",
  prefix: "/api/weather",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .get(
    "/forecast",
    async ({ query }) => {
      const log = useLogger();

      setLogContext(log, {
        provider: { name: "open-meteo" },
        destination: { query: query.city },
      });

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
