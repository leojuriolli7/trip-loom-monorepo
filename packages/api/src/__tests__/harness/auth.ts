import { auth } from "../../lib/auth";

export const TEST_USER_ID_HEADER = "x-test-user-id";

type AuthSessionMock = {
  enable: () => void;
  restore: () => void;
};

type GetSession = typeof auth.api.getSession;
const originalGetSession: GetSession = auth.api.getSession;

/**
 * Creates a header-driven auth mock for route tests.
 *
 * Any request with `x-test-user-id` is treated as authenticated for that user.
 */
export function createHeaderAuthMock(prefix: string): AuthSessionMock {
  const mock: GetSession = (async (input?: {
    headers?: HeadersInit;
  }) => {
    const headers = input?.headers ? new Headers(input.headers) : null;
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
    };
  }) satisfies (...args: Parameters<GetSession>) => ReturnType<GetSession> as GetSession;

  return {
    enable: () => {
      auth.api.getSession = mock;
    },
    restore: () => {
      auth.api.getSession = originalGetSession;
    },
  };
}
