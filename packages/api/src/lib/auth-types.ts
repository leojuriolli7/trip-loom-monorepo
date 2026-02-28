/**
 * Session shape returned by Better Auth's `GET /auth/get-session` endpoint.
 *
 * Defined manually to avoid importing the runtime `auth` instance (which
 * drags in the database connection). Keep in sync with the `user` and
 * `session` tables in `db/schema.ts`.
 */
export type AuthSession = {
  session: {
    id: string;
    expiresAt: string;
    token: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: string;
    updatedAt: string;
  };
};
