import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

export function registerPing(server: McpServer) {
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
}
