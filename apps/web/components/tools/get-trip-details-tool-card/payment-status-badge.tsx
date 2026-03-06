import type { PaymentStatus } from "@trip-loom/contracts/enums";
import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "./utils";

const paymentStatusClasses: Record<PaymentStatus, string> = {
  pending: "border-transparent bg-amber-500/15 text-amber-700",
  processing: "border-transparent bg-sky-500 text-white",
  succeeded: "border-transparent bg-green-500 text-white",
  failed: "border-transparent bg-red-500 text-white",
  refunded: "border-transparent bg-slate-700 text-white",
  partially_refunded: "border-transparent bg-violet-500 text-white",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={paymentStatusClasses[status]}>
      {formatEnumLabel(status)}
    </Badge>
  );
}
