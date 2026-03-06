class HttpError extends Error {
  readonly status: number;

  constructor(status: number, name: string, message: string) {
    super(message);
    this.name = name;
    this.status = status;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, "BadRequest", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, "NotFound", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, "Forbidden", message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, "Conflict", message);
  }
}

export class BookingNotPayableError extends HttpError {
  constructor(message: string) {
    super(409, "BookingNotPayable", message);
  }
}

export class PaymentAlreadySuccessfulError extends HttpError {
  constructor(message: string) {
    super(409, "PaymentAlreadySuccessful", message);
  }
}

export class PaymentProcessingError extends HttpError {
  constructor(message: string) {
    super(409, "PaymentProcessing", message);
  }
}
