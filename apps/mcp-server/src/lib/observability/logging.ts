import { AsyncLocalStorage } from "node:async_hooks";
import { Elysia } from "elysia";
import { trace } from "@opentelemetry/api";
import {
  createRequestLogger,
  initLogger,
  type DrainContext,
  type EnrichContext,
  type RequestLogger,
} from "evlog";
import { createOTLPDrain } from "evlog/otlp";
import { createDrainPipeline } from "evlog/pipeline";
import {
  createRequestSizeEnricher,
  createTraceContextEnricher,
  createUserAgentEnricher,
} from "evlog/enrichers";
import type { ObservabilityConfig } from "./config";

type LoggerState = {
  headers: Record<string, string>;
  logger: RequestLogger;
  method: string;
  path: string;
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestLogger>();
const activeLoggers = new WeakSet<RequestLogger>();

const isDev = process.env.NODE_ENV !== "production";
const SLOW_REQUEST_MS = 1000;

const userAgentEnricher = createUserAgentEnricher();
const requestSizeEnricher = createRequestSizeEnricher();
const traceContextEnricher = createTraceContextEnricher();
const inactiveLogger = createRequestLogger();

function headersToObject(headers: Headers): Record<string, string> {
  const values: Record<string, string> = {};

  headers.forEach((value, key) => {
    values[key] = value;
  });

  return values;
}

function useErrorStatus(error: unknown): number {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return 500;
}

function resolveResponseStatus(status: unknown): number {
  return typeof status === "number" ? status : 200;
}

/**
 * Returns the request-scoped logger for the current async execution context.
 */
export function useLogger(): RequestLogger {
  const logger = storage.getStore();

  if (!logger || !activeLoggers.has(logger)) {
    throw new Error(
      "[observability] useLogger() was called outside of an observability context.",
    );
  }

  return logger;
}

function enrichLogger(state: LoggerState) {
  const event: Record<string, unknown> = {};
  const enrichContext = {
    event,
    headers: state.headers,
    request: {
      method: state.method,
      path: state.path,
      requestId: state.requestId,
    },
    response: {},
  } as EnrichContext;

  userAgentEnricher(enrichContext);
  requestSizeEnricher(enrichContext);
  traceContextEnricher(enrichContext);

  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    event.traceId ??= spanContext.traceId;
    event.spanId ??= spanContext.spanId;
  }

  if (Object.keys(event).length > 0) {
    state.logger.set(event);
  }
}

/**
 * Registers the MCP server logging lifecycle: create a request logger, enrich it,
 * emit one structured event per request, and log errors.
 */
export function createLoggingPlugin(config: ObservabilityConfig) {
  const drain = config.otlpEndpoint
    ? createDrainPipeline<DrainContext>({
        batch: {
          size: 50,
          intervalMs: 5000,
        },
        retry: {
          maxAttempts: 3,
          backoff: "exponential",
          initialDelayMs: 1000,
          maxDelayMs: 30000,
        },
        maxBufferSize: 1000,
        onDropped: (events, error) => {
          console.error(`[evlog] dropped ${events.length} event(s)`, error);
        },
      })(
        async (batch) => {
          await createOTLPDrain({
            endpoint: config.otlpEndpoint,
            serviceName: config.serviceName,
            timeout: 5000,
          })(batch);
        },
      )
    : undefined;

  initLogger({
    drain,
    env: {
      service: config.serviceName,
    },
    pretty: isDev,
    sampling: {
      rates: isDev
        ? undefined
        : {
            info: 10,
            warn: 100,
            error: 100,
          },
      keep: [
        { status: 400 },
        { duration: SLOW_REQUEST_MS },
        { path: "/mcp" },
      ],
    },
  });

  const requestState = new WeakMap<Request, LoggerState>();
  const emitted = new WeakSet<Request>();

  return new Elysia({ name: "logging" })
    .derive({ as: "global" }, ({ request }) => {
      const url = new URL(request.url);
      const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
      const state: LoggerState = {
        headers: headersToObject(request.headers),
        logger: createRequestLogger({
          method: request.method,
          path: url.pathname,
          requestId,
        }),
        method: request.method,
        path: url.pathname,
        requestId,
      };

      enrichLogger(state);
      activeLoggers.add(state.logger);
      storage.enterWith(state.logger);
      requestState.set(request, state);

      return { log: state.logger };
    })
    .onAfterHandle({ as: "global" }, ({ request, set }) => {
      const state = requestState.get(request);

      if (!state || emitted.has(request)) {
        return;
      }

      emitted.add(request);
      state.logger.set({ status: resolveResponseStatus(set.status) });
      state.logger.emit();
      activeLoggers.delete(state.logger);
      storage.enterWith(inactiveLogger);
    })
    .onError({ as: "global" }, ({ error, request }) => {
      const state = requestState.get(request);

      if (!state || emitted.has(request)) {
        return;
      }

      emitted.add(request);

      const status = useErrorStatus(error);

      state.logger.error(error instanceof Error ? error : new Error(String(error)));
      state.logger.set({ status });
      state.logger.emit({ _forceKeep: true });

      activeLoggers.delete(state.logger);
      storage.enterWith(inactiveLogger);
    })
    .onStop(async () => {
      await drain?.flush();
    });
}
