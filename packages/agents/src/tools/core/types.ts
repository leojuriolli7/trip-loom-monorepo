import type {
  RequestCancellationInterrupt,
  RequestCancellationResume,
} from "../request-cancellation";
import type {
  RequestPaymentInterrupt,
  RequestPaymentResume,
} from "../request-payment";

export type TripLoomInterruptValue =
  | RequestCancellationInterrupt
  | RequestPaymentInterrupt;

export type TripLoomResumePayload =
  | RequestCancellationResume
  | RequestPaymentResume;
