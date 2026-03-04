import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { DynamicStructuredTool } from "@langchain/core/tools";

export interface McpClientConfig {
  /** MCP server URL (e.g. http://localhost:3002/mcp) */
  mcpUrl: string;
  /** User-scoped OAuth access token for MCP authentication */
  accessToken: string;
}

/**
 * Creates a MultiServerMCPClient configured to connect to the TripLoom
 * MCP server via Streamable HTTP transport with Bearer token auth.
 *
 * The client is stateless by default — each tool invocation creates a
 * fresh MCP session. This avoids session management complexity while
 * still authenticating every request.
 */
export function createMcpClient(config: McpClientConfig): MultiServerMCPClient {
  return new MultiServerMCPClient({
    triploom: {
      transport: "http",
      url: config.mcpUrl,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    },
  });
}

/**
 * Loads all MCP tools from the connected server as LangChain tools.
 * Must be called after creating the client — handles connection initialization.
 */
export async function loadMcpTools(
  client: MultiServerMCPClient,
): Promise<DynamicStructuredTool[]> {
  return client.getTools();
}
