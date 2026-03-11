import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../api-client";

export function registerGetPaymentSession(
  server: McpServer,
  apiClient: ApiClient,
) {
  server.registerTool(
    "get_payment_session",
    {
      title: "Get Payment Session",
      description:
        "Retrieve the current state of a hosted payment session by its session ID. Useful after sharing a checkout link when an external agent wants to verify whether payment is still pending or already completed.",
      inputSchema: z.object({
        sessionId: z.string().describe("The payment session ID to inspect."),
      }),
    },
    async ({ sessionId }) => {
      const { data, error } = await apiClient.api.payments({ id: sessionId }).session.get();

      if (error) {
        const message =
          error.value?.message ??
          `Failed to fetch payment session: ${error.status ?? "unknown error"}`;

        return {
          isError: true as const,
          content: [{ type: "text" as const, text: message }],
        };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    },
  );
}
