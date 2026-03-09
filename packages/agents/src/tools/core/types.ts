import type {
  RequestPaymentInterrupt,
  RequestPaymentResume,
} from "../request-payment";
import type {
  RequestSeatSelectionInterrupt,
  RequestSeatSelectionResume,
} from "../request-seat-selection";
import type {
  ToolApprovalInterrupt,
  ToolApprovalResume,
} from "./with-approval";

export type TripLoomInterruptValue =
  | ToolApprovalInterrupt
  | RequestPaymentInterrupt
  | RequestSeatSelectionInterrupt;

export type TripLoomResumePayload =
  | ToolApprovalResume
  | RequestPaymentResume
  | RequestSeatSelectionResume;
