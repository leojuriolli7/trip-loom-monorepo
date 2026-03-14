import { createLogger } from "evlog";

/**
 * Creates a standalone structured logger for agent lifecycle events.
 *
 * Uses the host process's evlog configuration (drain, pretty printing,
 * sampling). The host (API server) is responsible for calling `initLogger()`.
 */
export function createAgentLogger(kind: string, context?: Record<string, unknown>) {
  return createLogger({ kind, ...context });
}
