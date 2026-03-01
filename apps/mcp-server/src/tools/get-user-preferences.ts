import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerGetUserPreferences(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "get_user_preferences",
    {
      title: "Get User Preferences",
      description:
        "Retrieve the authenticated user's travel preferences including preferred cabin class, budget range, travel interests, preferred regions, dietary restrictions, and accessibility needs. Use this to personalize trip recommendations.",
      inputSchema: z.object({}),
    },
    async () => {
      const { data, error } = await apiClient.api.user.preferences.get();

      if (error) {
        return {
          isError: true as const,
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch user preferences: ${error.status ?? "unknown error"}`,
            },
          ],
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );
}
