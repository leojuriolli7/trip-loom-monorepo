import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { suggestionsResponseSchema } from "../dto/suggestions";
import { requireAuthMacro } from "../lib/auth/plugin";
import { createDefaultRateLimit } from "../lib/rate-limit";
import { getSuggestions } from "../services/suggestions";

const tripIdParamSchema = z.object({
  id: z.string().min(1),
});

export const suggestionsRoutes = new Elysia({
  name: "suggestions",
  prefix: "/api/trips",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .get(
    "/:id/suggestions",
    async ({ user, params }) => {
      return getSuggestions(user.id, params.id);
    },
    {
      auth: true,
      params: tripIdParamSchema,
      response: {
        200: suggestionsResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
