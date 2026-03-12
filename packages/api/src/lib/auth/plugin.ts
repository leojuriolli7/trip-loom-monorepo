import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import { useLogger } from "../observability";
import { auth } from ".";
import { db } from "../../db";
import { user as userTable } from "../../db/schema";

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
  .macro({
    /**
     * Auth macro - protects routes and injects user/session into context.
     *
     * Supports two auth methods:
     * 1. Session cookies (web app) — via auth.api.getSession
     * 2. OAuth Bearer tokens (MCP server) — via auth.api.getMcpSession
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
      async resolve({ set, status, request: { headers } }) {
        const log = useLogger();
        // 1. Try session cookie auth (web app)
        const session = await auth.api.getSession({ headers });

        if (session) {
          log.set({ user: { id: session.user.id } });

          return {
            user: session.user,
            session: session.session,
          };
        }

        // 2. Try OAuth Bearer token auth (MCP server)
        const authHeader = new Headers(headers).get("authorization");

        if (authHeader?.startsWith("Bearer ")) {
          // getMcpSession validates OAuth access tokens issued by the MCP plugin.
          // Cast needed because the MCP plugin type (MCPOptions) isn't exported
          // by better-auth, so the `as any` on the plugin in auth.ts strips its types.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mcpSession = await auth.api.getMcpSession({ headers });

          if (mcpSession?.userId) {
            const [user] = await db
              .select()
              .from(userTable)
              .where(eq(userTable.id, mcpSession.userId))
            .limit(1);

            if (user) {
              log.set({ user: { id: user.id } });

              return {
                user,
                session: {
                  id: mcpSession.accessToken,
                  expiresAt: mcpSession.accessTokenExpiresAt,
                  token: mcpSession.accessToken,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  ipAddress: null,
                  userAgent: null,
                  userId: user.id,
                },
              };
            }
          }
        }

        set.status = 401;
        log.set({ status: 401 });
        return status(401, {
          error: "Unauthorized",
          message: "Authentication required",
          statusCode: 401,
        });
      },
    },
  });
