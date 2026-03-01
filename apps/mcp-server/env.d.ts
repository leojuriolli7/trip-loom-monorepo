export interface McpServerEnv {
  API_BASE_URL: string;
  MCP_SERVER_PORT?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends McpServerEnv {}
  }
}

export {};
