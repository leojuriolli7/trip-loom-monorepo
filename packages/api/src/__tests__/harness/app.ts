import { Elysia } from "elysia";
import {
  BadRequestError,
  BookingNotPayableError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PaymentAlreadySuccessfulError,
  PaymentProcessingError,
} from "../../errors";

/**
 * Creates a test app with the same error mapping behavior used by the main API app.
 * Tests can compose only the routes they need with `.use(routeModule)`.
 */
export function createTestApp() {
  return new Elysia()
    .error({
      BadRequestError,
      BookingNotPayableError,
      NotFoundError,
      ForbiddenError,
      ConflictError,
      PaymentAlreadySuccessfulError,
      PaymentProcessingError,
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
          return status(error.status, {
            error: error.name,
            message: error.message,
            statusCode: error.status,
          });
      }
    });
}
