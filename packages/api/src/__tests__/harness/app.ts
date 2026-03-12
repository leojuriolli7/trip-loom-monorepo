import { Elysia } from "elysia";
import {
  createLoggingPlugin,
  createTracingPlugin,
  type ObservabilityConfig,
} from "../../lib/observability";
import {
  BadRequestError,
  BookingNotPayableError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentAlreadySuccessfulError,
  PaymentProcessingError,
  ServiceUnavailableError,
  TooManyRequestsError,
} from "../../errors";

/**
 * Creates a test app with the same error mapping behavior used by the main API app.
 * Tests can compose only the routes they need with `.use(routeModule)`.
 */
export function createTestApp() {
  const observability: ObservabilityConfig = {
    otlpEndpoint: undefined,
    serviceName: "trip-loom-api-test",
    traceExporterUrl: undefined,
  };

  return new Elysia()
    .use(createTracingPlugin(observability))
    .use(createLoggingPlugin(observability))
    .error({
      BadRequestError,
      BookingNotPayableError,
      NotFoundError,
      ForbiddenError,
      ConflictError,
      PaymentAlreadySuccessfulError,
      PaymentProcessingError,
      ServiceUnavailableError,
      TooManyRequestsError,
    })
    .onError(({ code, error, status }) => {
      switch (code) {
        case "BadRequestError":
        case "BookingNotPayableError":
        case "NotFoundError":
        case "ForbiddenError":
        case "ConflictError":
        case "PaymentAlreadySuccessfulError":
        case "PaymentProcessingError":
        case "ServiceUnavailableError":
        case "TooManyRequestsError":
          return status(error.status, {
            error: error.name,
            message: error.message,
            statusCode: error.status,
          });
      }
    });
}
