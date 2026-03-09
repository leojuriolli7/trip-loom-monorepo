import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";

type GetRecommendedDestinationsCardProps = {
  args: TripLoomToolArgsByName<"get_recommended_destinations">;
};

export function GetRecommendedDestinationsCard(
  props: GetRecommendedDestinationsCardProps,
) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src="/palm-tree.png"
          alt="Palm Tree"
          className="scale-110"
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            Looking up recommended destinations
          </ToolCallCard.Title>
          <ToolCallCard.Description>
            Looking up recommendations based on past trips, taste, and preferred
            regions
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
