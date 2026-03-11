import type {
  BookingPaymentInterrupt,
  BookingPaymentResume,
  RequestSeatSelectionInterrupt,
  SeatSelectionResume,
} from "../booking-flow";
import type {
  ToolApprovalInterrupt,
  ToolApprovalResume,
} from "./with-approval";

export type TripLoomInterruptValue =
  | ToolApprovalInterrupt
  | BookingPaymentInterrupt
  | RequestSeatSelectionInterrupt;

export type TripLoomResumePayload =
  | ToolApprovalResume
  | BookingPaymentResume
  | SeatSelectionResume;

export type { BookingPaymentInterrupt };
