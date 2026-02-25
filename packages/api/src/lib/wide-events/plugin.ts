import { Elysia } from "elysia";
import { trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

export interface WideEventPluginOptions {
  /**
   * Custom log function. Receives the finalized event object.
   * @default (event) => console.log(JSON.stringify(event))
   */
  logger?: (event: Record<string, unknown>) => void;

  /**
   * Service name added to every event.
   * @default "trip-loom-api"
   */
  service?: string;

  /**
   * Static fields merged into every event (e.g. version, region).
   */
  extraFields?: Record<string, unknown>;
}

const defaultLogger = (event: Record<string, unknown>) => {
  console.log(JSON.stringify(event));
};

export const createWideEventPlugin = (options?: WideEventPluginOptions) => {
  const logger = options?.logger ?? defaultLogger;
  const service = options?.service ?? "trip-loom-api";
  const extraFields = options?.extraFields ?? {};

  const otelLogger = logs.getLogger("wide-events");

  return new Elysia({ name: "elysia-wide-event" })
    .derive({ as: "global" }, ({ request }) => {
      const startTime = performance.now();
      const url = new URL(request.url);
      const requestId = crypto.randomUUID();

      const wideEvent: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        service,
        request_id: requestId,
        method: request.method,
        path: url.pathname,
        ...extraFields,
      };

      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        const ctx = activeSpan.spanContext();
        wideEvent.trace_id = ctx.traceId;
        wideEvent.span_id = ctx.spanId;
      }

      return {
        wideEvent,
        requestId,
        _startTime: startTime,
      };
    })
    .onError({ as: "global" }, (ctx) => {
      if (!ctx.wideEvent) return;

      const message =
        "message" in ctx.error ? String(ctx.error.message) : ctx.code;
      const status =
        "status" in ctx.error ? (ctx.error as { status: number }).status : 500;

      ctx.wideEvent.error = {
        type: ctx.code,
        message,
        status,
      };
    })
    .onAfterResponse({ as: "global" }, (ctx) => {
      if (!ctx.wideEvent) return;

      ctx.wideEvent.status_code = ctx.set.status ?? 200;
      ctx.wideEvent.duration_ms = Math.round(
        performance.now() - (ctx._startTime ?? 0),
      );
      ctx.wideEvent.outcome = ctx.wideEvent.error ? "error" : "success";

      // Console log (always)
      logger(ctx.wideEvent);

      const isError = !!ctx.wideEvent.error;

      otelLogger.emit({
        severityNumber: isError ? SeverityNumber.ERROR : SeverityNumber.INFO,
        severityText: isError ? "ERROR" : "INFO",
        body: `${ctx.wideEvent.method} ${ctx.wideEvent.path} ${ctx.wideEvent.status_code}`,
        attributes: ctx.wideEvent as Record<string, string | number | boolean>,
      });
    });
};
