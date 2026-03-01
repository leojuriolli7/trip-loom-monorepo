import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createMcpServer() {
  const server = new McpServer(
    { name: "triploom", version: "1.0.0" },
    { capabilities: { logging: {} } },
  );

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

  return server;
}
