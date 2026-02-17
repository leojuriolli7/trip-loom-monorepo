class HttpError extends Error {
  readonly status: number;
  readonly error: string;

  constructor(status: number, error: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.error = error;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, "Bad Request", message);
    this.name = "BadRequestError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, "Not Found", message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, "Forbidden", message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, "Conflict", message);
    this.name = "ConflictError";
  }
}
