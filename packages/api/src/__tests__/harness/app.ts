import { Elysia } from "elysia";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../errors";

/**
 * Creates a test app with the same error mapping behavior used by the main API app.
 * Tests can compose only the routes they need with `.use(routeModule)`.
 */
export function createTestApp() {
  return new Elysia()
    .error({
      BadRequestError,
      NotFoundError,
      ForbiddenError,
      ConflictError,
    })
    .onError(({ code, error, status }) => {
      switch (code) {
        case "BadRequestError":
        case "NotFoundError":
        case "ForbiddenError":
        case "ConflictError":
          return status(error.status, {
            error: error.error,
            message: error.message,
            statusCode: error.status,
          });
      }
    });
}

