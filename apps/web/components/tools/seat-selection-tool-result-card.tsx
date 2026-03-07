import type { RequestSeatSelectionToolResult } from "@trip-loom/contracts/dto/payments";
import { ArmchairIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolCallCard } from "./tool-call-card";

type SeatSelectionToolResultCardProps = {
  result: RequestSeatSelectionToolResult;
};

export function SeatSelectionToolResultCard({
  result,
}: SeatSelectionToolResultCardProps) {
  const selected = result.seatId !== null;

  return (
    <ToolCallCard size="lg">
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src={"/plane-seat-3.png"}
          alt="Blue airplane seat"
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            {selected ? "Seat selected" : "No seat selected"}
          </ToolCallCard.Title>
          <ToolCallCard.Description className="-mt-1">
            {selected
              ? `Seat ${result.seatId} will be included in the booking`
              : "Booking will proceed without a seat assignment"}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
