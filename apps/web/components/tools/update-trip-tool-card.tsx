import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";

type UpdateTripToolCallCardProps = {
  args: TripLoomToolArgsByName<"update_trip">;
};

function formatUpdateTripSummary(args: TripLoomToolArgsByName<"update_trip">) {
  const updates: string[] = [];

  if (args.title !== undefined) {
    updates.push(args.title === null ? "cleared title" : "updated title");
  }

  if (args.destinationId !== undefined) {
    updates.push(
      args.destinationId === null
        ? "removed destination"
        : "changed destination",
    );
  }

  if (args.startDate !== undefined || args.endDate !== undefined) {
    updates.push("changed trip dates");
  }

  if (updates.length === 0) {
    return "Applied changes to your trip";
  }

  return `${updates.join(", ")}`;
}

export function UpdateTripToolCallCard({ args }: UpdateTripToolCallCardProps) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/pencil.png" alt="Pencil" className="p-1" />

        <div className="mt-0.5">
          <ToolCallCard.Title>Updated your trip</ToolCallCard.Title>
          <ToolCallCard.Description>
            {formatUpdateTripSummary(args)}
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
