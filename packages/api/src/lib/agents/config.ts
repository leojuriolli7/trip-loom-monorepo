const MCP_SERVER_URL = process.env.MCP_SERVER_URL;
const DATABASE_URL = process.env.DATABASE_URL;

export function getAgentsConfig() {
  if (!MCP_SERVER_URL) {
    throw new Error("MCP_SERVER_URL is required for chat streaming");
  }

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required for chat streaming");
  }

  return {
    mcpServerUrl: MCP_SERVER_URL,
    databaseUrl: DATABASE_URL,
  };
}
