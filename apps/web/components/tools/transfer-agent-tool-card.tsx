import type { TransferToolName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";

const titleByTool: Record<TransferToolName, string> = {
  transfer_to_hotel_agent: "Handed off to Hotel Advisor",
  transfer_to_destination_agent: "Handed off to Destination Guide",
  transfer_to_flight_agent: "Handed off to Flight Consultant",
  transfer_to_itinerary_agent: "Handed off to Itinerary Planner",
  transfer_back_to_supervisor: "Transferred to Travel Coordinator",
};

const imagesByTool: Record<TransferToolName, string> = {
  transfer_to_hotel_agent: "/hotel-bell.png",
  transfer_to_destination_agent: "/statue-liberty.png",
  transfer_to_flight_agent: "/plane.png",
  transfer_to_itinerary_agent: "/map.png",
  transfer_back_to_supervisor: "/compass.png",
};

export function TransferAgentToolCard({
  toolName,
}: {
  toolName: TransferToolName;
}) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src={imagesByTool[toolName]}
          alt={titleByTool[toolName]}
        />

        <ToolCallCard.Title className="mt-2.5 font-medium">
          {titleByTool[toolName]}
        </ToolCallCard.Title>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
