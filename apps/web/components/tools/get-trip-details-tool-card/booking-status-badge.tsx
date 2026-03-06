import type { BookingStatus } from "@trip-loom/contracts/enums";
import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "./utils";

const bookingStatusClasses: Record<BookingStatus, string> = {
  pending: "border-transparent bg-amber-500/15 text-amber-700",
  confirmed: "border-transparent bg-green-500 text-white",
  cancelled: "border-transparent bg-red-500 text-white",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge className={bookingStatusClasses[status]}>
      {formatEnumLabel(status)}
    </Badge>
  );
}
