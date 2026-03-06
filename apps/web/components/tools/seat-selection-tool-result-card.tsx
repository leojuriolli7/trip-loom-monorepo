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
    <ToolCallCard>
      <ToolCallCard.Header>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50">
          <ArmchairIcon className="size-5 text-muted-foreground" />
        </div>

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            {selected ? "Seat selected" : "No seat selected"}
          </ToolCallCard.Title>
          <ToolCallCard.Description>
            {selected
              ? `Seat ${result.seatId} will be included in the booking`
              : "Booking will proceed without a seat assignment"}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>

      {selected && (
        <ToolCallCard.Content>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Seat {result.seatId}</Badge>
          </div>
        </ToolCallCard.Content>
      )}
    </ToolCallCard>
  );
}
