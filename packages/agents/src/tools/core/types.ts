import type {
  RequestCancellationInterrupt,
  RequestCancellationResume,
} from "../request-cancellation";
import type {
  RequestPaymentInterrupt,
  RequestPaymentResume,
} from "../request-payment";
import type {
  RequestSeatSelectionInterrupt,
  RequestSeatSelectionResume,
} from "../request-seat-selection";

export type TripLoomInterruptValue =
  | RequestCancellationInterrupt
  | RequestPaymentInterrupt
  | RequestSeatSelectionInterrupt;

export type TripLoomResumePayload =
  | RequestCancellationResume
  | RequestPaymentResume
  | RequestSeatSelectionResume;
