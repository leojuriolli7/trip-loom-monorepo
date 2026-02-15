import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema";

const isDev = process.env.NODE_ENV !== "production";

export const auth = betterAuth({
  baseURL: process.env.API_BASE_URL,
  basePath: "/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Out of scope for now: Email verification
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  rateLimit: {
    enabled: !isDev,
    window: 10,
    max: 100,
  },
  advanced: {
    useSecureCookies: !isDev,
    // In dev, allow localhost origins
    ...(isDev && {
      crossSubDomainCookies: {
        enabled: false,
      },
    }),
  },
  trustedOrigins: isDev
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : (process.env.TRUSTED_ORIGINS?.split(",") ?? []),
});

export type Auth = typeof auth;
