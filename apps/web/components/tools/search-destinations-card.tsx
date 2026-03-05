import { ToolCallCard } from "@/components/tools/tool-call-card";

type SearchDestinationsToolCardProps = {
  args: unknown;
};
export function SearchDestinationsToolCard(
  props: SearchDestinationsToolCardProps,
) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src="/magnifying-glass.png"
          alt="Magnifying glass"
        />

        <div className="space-y-1">
          <ToolCallCard.Title>Searched destinations</ToolCallCard.Title>
          <ToolCallCard.Description>
            Searched for destinations that match your preferences
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
