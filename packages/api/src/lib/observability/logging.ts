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

type ValidationLikeError = Error & {
  errors?: unknown[];
  on?: string;
  property?: string;
  status?: number;
  type?: string;
};

type ParsedValidationError = {
  errors?: unknown[];
  message?: string;
  on?: string;
  property?: string;
  type?: string;
};

const storage = new AsyncLocalStorage<RequestLogger>();
const activeLoggers = new WeakSet<RequestLogger>();

const isDev = process.env.NODE_ENV !== "production";
const SLOW_REQUEST_MS = 1000;

const userAgentEnricher = createUserAgentEnricher();
const requestSizeEnricher = createRequestSizeEnricher();
const traceContextEnricher = createTraceContextEnricher();
const inactiveLogger = createRequestLogger();

/**
 * Converts request headers into a plain object so enrichers can inspect them
 * without depending on the Fetch `Headers` API.
 */
function headersToObject(headers: Headers): Record<string, string> {
  const values: Record<string, string> = {};

  headers.forEach((value, key) => {
    values[key] = value;
  });

  return values;
}

/**
 * Extracts an HTTP-like status code from unknown error values and falls back
 * to `500` when the error does not carry one.
 */
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

/**
 * Normalizes Elysia's response status into a number for request log emission.
 */
function resolveResponseStatus(status: unknown): number {
  return typeof status === "number" ? status : 200;
}

/**
 * Shrinks Elysia validation failures into a compact structured error so dev
 * logs stay readable while preserving the key debugging fields.
 */
function compactValidationError(
  error: Pick<
    ValidationLikeError,
    "errors" | "message" | "on" | "property" | "type"
  >,
): Error {
  const detail = [error.on, error.property].filter(Boolean).join(".");
  const suffix = detail ? ` at ${detail}` : "";
  const compact = new Error(
    `Validation failed${suffix}: ${error.message ?? "Invalid input"}`,
  );

  compact.name = "ValidationError";
  compact.stack = undefined;
  Object.assign(compact, {
    data: {
      issueCount: Array.isArray(error.errors) ? error.errors.length : undefined,
      on: error.on,
      property: error.property,
      type: error.type,
    },
    status: 422,
  });

  return compact;
}

/**
 * Parses validation payloads that Elysia serializes into `error.message` so we
 * can recover structured metadata before logging.
 */
function parseValidationMessage(error: Error): ParsedValidationError | null {
  try {
    const parsed = JSON.parse(error.message) as ParsedValidationError;

    if (parsed?.type === "validation") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Removes noisy details from expected client errors while keeping full server
 * errors intact for debugging.
 */
function sanitizeError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }

  const status = useErrorStatus(error);
  const validationError = error as ValidationLikeError;
  const parsedValidation = parseValidationMessage(error);

  if (validationError.type === "validation") {
    return compactValidationError(validationError);
  }

  if (status === 422 && parsedValidation) {
    return compactValidationError(
      Object.assign({}, error, {
        errors: parsedValidation.errors,
        message: parsedValidation.message,
        on: parsedValidation.on,
        property: parsedValidation.property,
        type: parsedValidation.type,
      }),
    );
  }

  if (status >= 400 && status < 500) {
    const compact = new Error(error.message);
    compact.name = error.name;
    compact.stack = undefined;
    Object.assign(compact, { status });
    return compact;
  }

  return error;
}

/**
 * Returns the request-scoped logger for the current async execution context.
 * Route handlers and services use this instead of threading a logger through
 * every function call.
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

/**
 * Runs the shared enrichers once per request and copies any derived trace
 * identifiers from the active OpenTelemetry span into the log context.
 */
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
 * Registers the API logging lifecycle: create a request logger, enrich it,
 * emit one structured event per request, and keep error logs compact.
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
        { path: "/api/payments/**" },
        { path: "/api/webhooks/**" },
        { path: "/api/trips/**/chat" },
        { path: "/auth/**" },
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

      const sanitizedError = sanitizeError(error);
      const status = useErrorStatus(sanitizedError);

      state.logger.error(sanitizedError);
      state.logger.set({ status });
      state.logger.emit({ _forceKeep: true });

      activeLoggers.delete(state.logger);
      storage.enterWith(inactiveLogger);
    })
    .onStop(async () => {
      await drain?.flush();
    });
}
