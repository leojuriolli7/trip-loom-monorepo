import { vi } from "vitest";
import { auth } from "../../lib/auth";

export const TEST_USER_ID_HEADER = "x-test-user-id";

type AuthSessionMock = {
  enable: () => void;
  restore: () => void;
};

/**
 * Creates a header-driven auth mock for route tests.
 *
 * Any request with `x-test-user-id` is treated as authenticated for that user.
 */
export function createHeaderAuthMock(prefix: string): AuthSessionMock {
  const spy = vi.spyOn(auth.api, "getSession");

  return {
    enable: () => {
      spy.mockImplementation(async (input) => {
        const headers = (input as { headers?: Headers }).headers;
        const userId = headers?.get(TEST_USER_ID_HEADER);

        if (!userId) {
          return null;
        }

        return {
          user: {
            id: userId,
            name: "Test User",
            email: `${userId}@example.test`,
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          session: {
            id: `${prefix}session_${userId}`,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            token: `${prefix}token_${userId}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ipAddress: null,
            userAgent: null,
            userId,
          },
        } as Awaited<ReturnType<typeof auth.api.getSession>>;
      });
    },
    restore: () => {
      spy.mockRestore();
    },
  };
}

