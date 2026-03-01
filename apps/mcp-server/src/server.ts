import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createApiClient } from "./api-client";
import { registerGetUserPreferences } from "./tools/get-user-preferences";
import { registerGetTripDetails } from "./tools/get-trip-details";

/**
 * Creates an MCP server instance with an authenticated Eden client.
 *
 * Each MCP session gets its own server + client, ensuring the OAuth
 * access token is scoped to the authenticated user.
 */
export function createMcpServer(accessToken: string) {
  const server = new McpServer(
    { name: "triploom", version: "1.0.0" },
    { capabilities: { logging: {} } },
  );

  const apiClient = createApiClient(accessToken);

  server.registerTool(
    "ping",
    {
      description: "Health check — returns pong",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text" as const, text: "pong" }],
    }),
  );

  registerGetUserPreferences(server, apiClient);
  registerGetTripDetails(server, apiClient);

  return server;
}
