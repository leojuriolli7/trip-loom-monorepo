import type { PaymentStatus } from "@trip-loom/contracts";

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  failed: "Failed",
  partially_refunded: "Partially Refunded",
  processing: "Processing",
  refunded: "Refunded",
  succeeded: "Succeeded",
  pending: "Pending",
};
