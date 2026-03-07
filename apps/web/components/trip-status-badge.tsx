import type { TripStatus } from "@trip-loom/contracts/enums";
import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { tripStatusLabels } from "@/lib/labels/trip-status-labels";

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
    size: {
      default: "",
      sm: "h-5 rounded-full px-2 text-[11px] font-semibold tracking-[0.01em]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type TripStatusBadgeProps = {
  status: TripStatus;
  size?: "default" | "sm";
  className?: ComponentProps<typeof Badge>["className"];
};

export function TripStatusBadge({
  status,
  size = "default",
  className,
}: TripStatusBadgeProps) {
  return (
    <Badge className={cn(badgeVariants({ status, size }), className)}>
      {tripStatusLabels[status]}
    </Badge>
  );
}
