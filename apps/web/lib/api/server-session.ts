import "server-only";

import { headers } from "next/headers";
import type { AuthSession } from "@trip-loom/api/auth/types";

/**
 * Fetches the current session from the API server.
 * Use this in Server Components instead of importing the auth instance directly.
 *
 * Returns the full session object (with `user` and `session`), or `null` if
 * the user is not authenticated.
 */
export async function getServerSession(): Promise<AuthSession | null> {
  const headersStore = await headers();
  const cookie = headersStore.get("cookie") ?? "";

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/get-session`,
    {
      headers: { cookie },
      cache: "no-store",
    },
  );

  if (!res.ok) return null;

  return res.json();
}
