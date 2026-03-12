import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { mcp } from "better-auth/plugins";

import { db } from "../../db";
import * as schema from "../../db/schema";
import { sendEmail } from "../email/transporter";
import { getVerifyEmailHtml } from "../email/templates/verify-email";
import { getForgotPasswordHtml } from "../email/templates/forgot-password";

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
      oauthApplication: schema.oauthApplication,
      oauthAccessToken: schema.oauthAccessToken,
      oauthConsent: schema.oauthConsent,
    },
  }),
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, token }) => {
      const url = new URL(
        "/auth/verify-email",
        process.env.VERIFY_EMAIL_BASE_URL,
      );

      url.search = new URLSearchParams({
        token,
        callbackURL: new URL(process.env.FRONTEND_BASE_URL, "/chat").toString(),
      }).toString();

      const verificationUrl = url.toString();

      void sendEmail({
        to: user.email,
        subject: "Verify your email - TripLoom",
        html: getVerifyEmailHtml({
          userName: user.name,
          verificationUrl,
        }),
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, token }) => {
      const url = new URL(
        "/forgot-password",
        process.env.FORGOT_PASSWORD_EMAIL_BASE_URL,
      );

      url.search = new URLSearchParams({ token }).toString();

      const resetUrl = url.toString();

      void sendEmail({
        to: user.email,
        subject: "Reset your password - TripLoom",
        html: getForgotPasswordHtml({
          userName: user.name,
          resetUrl,
        }),
      });
    },
    resetPasswordTokenExpiresIn: 3600,
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
    ? [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
      ]
    : (process.env.TRUSTED_ORIGINS?.split(",") ?? []),
  plugins: [
    mcp({
      loginPage: new URL("/enter", process.env.FRONTEND_BASE_URL).toString(),
    }),
  ],
});

export type Auth = typeof auth;
