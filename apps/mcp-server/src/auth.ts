import { mcpAuthHono } from "better-auth/plugins/mcp/client/adapters";

const MCP_SERVER_PORT = process.env.MCP_SERVER_PORT ?? "3002";
const MCP_SERVER_URL = `http://localhost:${MCP_SERVER_PORT}`;

export const { middleware: mcpAuthMiddleware, discoveryRoutes } = mcpAuthHono({
  authURL: `${process.env.API_BASE_URL}/auth`,
  resource: MCP_SERVER_URL,
});
