import { trace } from "@opentelemetry/api";
import { createLogger } from "evlog";

const SENSITIVE_FIELDS = new Set([
  "password",
  "token",
  "accessToken",
  "secret",
  "authorization",
  "cardNumber",
  "cvv",
  "ssn",
]);

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function getTraceIds(): { traceId?: string; spanId?: string } {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) return {};

  const spanContext = activeSpan.spanContext();
  return { traceId: spanContext.traceId, spanId: spanContext.spanId };
}

/**
 * Wraps an MCP tool handler callback with structured logging.
 * Logs tool name, sanitized args, durationMs: duration, success/error, and OTEL trace IDs.
 */
export function withToolLogging<T extends (...args: any[]) => any>(
  toolName: string,
  handler: T,
): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const start = performance.now();
    // Tools with inputSchema get (args, extra); zero-arg tools get (extra) only.
    // Only log the first argument when there are two — that's the parsed tool input.
    const callArgs =
      args.length >= 2
        ? (args[0] as Record<string, unknown>)
        : undefined;

    try {
      const result = await handler(...args);
      const duration = Math.round(performance.now() - start);
      const isError = result && typeof result === "object" && "isError" in result && result.isError;

      const log = createLogger({
        kind: "mcp.tool_call",
        tool: toolName,
        args: callArgs ? sanitizeArgs(callArgs) : undefined,
        durationMs: duration,
        success: !isError,
        ...(isError ? { mcpError: true } : {}),
        ...getTraceIds(),
      });

      if (isError) {
        log.emit({ _forceKeep: true });
      } else {
        log.emit();
      }

      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);

      const log = createLogger({
        kind: "mcp.tool_call",
        tool: toolName,
        args: callArgs ? sanitizeArgs(callArgs) : undefined,
        durationMs: duration,
        success: false,
        ...getTraceIds(),
      });

      log.error(error instanceof Error ? error : new Error(String(error)));
      log.emit({ _forceKeep: true });

      throw error;
    }
  };

  return wrapped as T;
}
