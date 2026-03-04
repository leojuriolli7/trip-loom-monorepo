import { and, eq, gt } from "drizzle-orm";
import { db, oauthAccessToken, oauthApplication } from "../../db";
import { generateId } from "../nanoid";

const AGENT_CLIENT_ID = "triploom-agent";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Ensures the internal OAuth application for agent→MCP auth exists.
 * Creates it on first call, no-ops on subsequent calls.
 */
async function ensureAgentApplication(): Promise<void> {
  const [existing] = await db
    .select({ id: oauthApplication.id })
    .from(oauthApplication)
    .where(eq(oauthApplication.clientId, AGENT_CLIENT_ID))
    .limit(1);

  if (existing) return;

  await db.insert(oauthApplication).values({
    id: generateId(),
    name: "TripLoom Agent (Internal)",
    clientId: AGENT_CLIENT_ID,
    type: "confidential",
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Gets or creates a user-scoped OAuth access token for agent→MCP communication.
 *
 * Reuses an existing valid (non-expired) token if one exists for this user
 * and the agent client. Otherwise creates a new one with a 7-day TTL.
 *
 * The token is inserted into the same `oauth_access_token` table that
 * Better Auth's MCP plugin uses. The MCP server validates it via
 * `auth.api.getMcpSession()` — identical to browser-issued tokens.
 */
export async function getOrCreateAgentToken(
  userId: string,
): Promise<string> {
  await ensureAgentApplication();

  // Check for existing valid token
  const [existing] = await db
    .select({ accessToken: oauthAccessToken.accessToken })
    .from(oauthAccessToken)
    .where(
      and(
        eq(oauthAccessToken.userId, userId),
        eq(oauthAccessToken.clientId, AGENT_CLIENT_ID),
        gt(oauthAccessToken.accessTokenExpiresAt, new Date()),
      ),
    )
    .limit(1);

  if (existing?.accessToken) {
    return existing.accessToken;
  }

  // Create a new token
  const accessToken = generateId() + generateId(); // ~42 chars
  const now = new Date();

  await db.insert(oauthAccessToken).values({
    id: generateId(),
    accessToken,
    userId,
    clientId: AGENT_CLIENT_ID,
    scopes: "mcp:*",
    accessTokenExpiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
    createdAt: now,
    updatedAt: now,
  });

  return accessToken;
}
