import { Elysia } from "elysia";
import { requireAuthMacro } from "../lib/auth-plugin";
import { errorResponseSchema } from "../dto/common";
import {
  userPreferenceInputSchema,
  userPreferenceSchema,
} from "../dto/user-preferences";
import {
  getOrCreateUserPreferences,
  upsertUserPreferences,
} from "../services/user-preferences";

export const userPreferenceRoutes = new Elysia({
  name: "user-preferences",
  prefix: "/api/user",
})
  .use(requireAuthMacro)
  .get(
    "/preferences",
    async ({ user }) => {
      return getOrCreateUserPreferences(user.id);
    },
    {
      auth: true,
      response: {
        200: userPreferenceSchema,
        401: errorResponseSchema,
      },
    },
  )
  .put(
    "/preferences",
    async ({ user, body }) => {
      return upsertUserPreferences(user.id, body);
    },
    {
      auth: true,
      body: userPreferenceInputSchema,
      response: {
        200: userPreferenceSchema,
        401: errorResponseSchema,
      },
    },
  );
