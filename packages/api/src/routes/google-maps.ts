import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import {
  getPlaceDetailsQuerySchema,
  googlePlaceDetailsSchema,
  googlePlaceSummarySchema,
  searchPlacesQuerySchema,
} from "@trip-loom/contracts/dto";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import { getPlaceDetails, searchPlaces } from "../services/google-maps";

export const googleMapsRoutes = new Elysia({
  name: "google-maps",
  prefix: "/api/maps",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .get(
    "/places/search",
    async ({ query }) => {
      return searchPlaces(query);
    },
    {
      auth: true,
      query: searchPlacesQuerySchema,
      response: {
        200: googlePlaceSummarySchema.array(),
        400: errorResponseSchema,
        401: errorResponseSchema,
        429: errorResponseSchema,
        503: errorResponseSchema,
      },
    },
  )
  .get(
    "/places/:placeId",
    async ({ params, query }) => {
      return getPlaceDetails({
        placeId: params.placeId,
        languageCode: query.languageCode,
        regionCode: query.regionCode,
      });
    },
    {
      auth: true,
      params: z.object({
        placeId: z.string().min(1),
      }),
      query: getPlaceDetailsQuerySchema,
      response: {
        200: googlePlaceDetailsSchema,
        400: errorResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
        429: errorResponseSchema,
        503: errorResponseSchema,
      },
    },
  );
