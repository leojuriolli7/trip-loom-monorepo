import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";

type GetWeatherToolCallCardProps = {
  args: TripLoomToolArgsByName<"get_weather">;
};

export function GetWeatherToolCallCard(props: GetWeatherToolCallCardProps) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src="/clear-day.png"
          alt="Clear day, field"
          className="object-cover rounded-2xl"
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title className="mt-2.5">
            Looked up weather for {props.args?.city}
          </ToolCallCard.Title>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
