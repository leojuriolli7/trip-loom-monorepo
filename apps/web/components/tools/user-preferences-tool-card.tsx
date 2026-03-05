import { ToolCallCard } from "@/components/tools/tool-call-card";

export function UserPreferencesToolCard() {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image src="/duffel.png" alt="Duffel bag" />

        <div className="space-y-0.5">
          <ToolCallCard.Title>Read your travel preferences</ToolCallCard.Title>
          <ToolCallCard.Description>
            Checked your saved profile so new suggestions match your style,
            budget, and comfort needs
          </ToolCallCard.Description>
        </div>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
