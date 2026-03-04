import type {
  RequestConfirmationInterrupt,
  RequestConfirmationResume,
} from "../request-confirmation";
import type {
  RequestPaymentInterrupt,
  RequestPaymentResume,
} from "../request-payment";

export type TripLoomInterruptValue =
  | RequestConfirmationInterrupt
  | RequestPaymentInterrupt;

export type TripLoomConfirmationResume = RequestConfirmationResume;
export type TripLoomPaymentResume = RequestPaymentResume;

export type TripLoomResumePayload =
  | TripLoomConfirmationResume
  | TripLoomPaymentResume;
