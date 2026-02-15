import { Elysia } from "elysia";
import { auth } from "../lib/auth";

/**
 * Authentication routes powered by Better Auth.
 * Mounted at /auth/* (configured via Better Auth basePath in lib/auth.ts)
 *
 * Key endpoints:
 * - POST /auth/sign-up/email - Create account
 * - POST /auth/sign-in/email - Sign in
 * - POST /auth/sign-out - Sign out
 * - GET  /auth/session - Get current session
 */
export const authRoutes = new Elysia({ name: "auth" }).mount(auth.handler);
