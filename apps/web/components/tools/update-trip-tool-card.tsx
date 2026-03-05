import { ToolCallCard } from "@/components/tools/tool-call-card";

type UpdateTripToolCallCardProps = {
  args: unknown;
};
export function UpdateTripToolCallCard(props: UpdateTripToolCallCardProps) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/pencil.png" alt="Pencil" className="p-1" />

        <div className="mt-3">
          <ToolCallCard.Title>Updated your trip</ToolCallCard.Title>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
