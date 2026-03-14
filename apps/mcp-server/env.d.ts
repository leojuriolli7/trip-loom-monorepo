export interface McpServerEnv {
  API_BASE_URL: string;
  MCP_SERVER_PORT?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_SERVICE_NAME?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line
    interface ProcessEnv extends McpServerEnv {}
  }
}

export {};
