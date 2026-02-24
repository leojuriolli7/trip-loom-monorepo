import { Elysia } from "elysia";
import { createWideEventPlugin } from "./wide-events";
import { auth } from "./auth";

/**
 * Auth plugins for Better Auth + Elysia macro-based route protection.
 *
 * Why macros over guards/derive?
 * - Declarative: Just add { auth: true } to any route
 * - Type-safe: Full inference of user/session in handlers
 * - Secure: Uses `resolve` which runs AFTER validation
 * - Clean: Uses `status()` helper for proper error typing
 *
 * @see https://elysiajs.com/integrations/better-auth
 * @see https://elysiajs.com/patterns/macro
 *
 * @example
 * ```ts
 * const app = new Elysia()
 *   .use(authHandlerPlugin)
 *   .get('/public', () => 'Anyone can access')
 *   .use(
 *     new Elysia().use(requireAuthMacro).get('/protected', ({ user }) => `Hello ${user.name}`, { auth: true })
 *   )
 * ```
 */
export const requireAuthMacro = new Elysia({
  name: "require-auth-macro",
})
  .use(createWideEventPlugin())
  .macro({
  /**
   * Auth macro - protects routes and injects user/session into context.
   *
   * Uses `resolve` instead of `derive` because:
   * - `resolve` runs AFTER validation (more secure)
   * - `derive` runs BEFORE validation (less secure)
   *
   * Uses `status()` instead of `set.status` because:
   * - Better type inference for error responses
   * - Cleaner early return pattern
   */
  auth: {
    async resolve({ status, request: { headers }, wideEvent }) {
      const session = await auth.api.getSession({ headers });

      if (!session) {
        return status(401, {
          error: "Unauthorized",
          message: "Authentication required",
          statusCode: 401,
        });
      }

      wideEvent.user_id = session.user.id;

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
