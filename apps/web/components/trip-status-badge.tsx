import type { TripStatus } from "@trip-loom/api/enums";
import { cva } from "class-variance-authority";
import { Badge } from "./ui/badge";

const tripLabels: Record<TripStatus, string> = {
  cancelled: "Cancelled",
  current: "Ongoing",
  draft: "Draft",
  past: "Finalized",
  upcoming: "Upcoming",
};

const badgeVariants = cva("border-transparent", {
  variants: {
    status: {
      cancelled:
        "bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-destructive",
      current: "bg-chart-3 text-chart-5",
      draft: "bg-chart-1 text-chart-5",
      past: "bg-chart-5 text-chart-1",
      upcoming: "bg-chart-2 text-chart-5",
    },
  },
});

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return <Badge className={badgeVariants({ status })}>{tripLabels[status]}</Badge>;
}
