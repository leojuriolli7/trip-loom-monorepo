import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";

type SearchDestinationsToolCardProps = {
  args: TripLoomToolArgsByName<"search_destinations">;
};

function formatSearchDestinationsSummary(
  args: TripLoomToolArgsByName<"search_destinations">,
) {
  const filters: string[] = [];

  if (args.search) {
    filters.push(`query "${args.search}"`);
  }

  if (args.regions?.length) {
    filters.push(`region ${args.regions.join(", ")}`);
  }

  if (args.countries?.length) {
    filters.push(`country ${args.countries.join(", ")}`);
  }

  if (args.highlights?.length) {
    filters.push(`highlight ${args.highlights.join(", ")}`);
  }

  const limit = args.limit ?? 20;
  const searchScope = `${limit} destination${limit === 1 ? "" : "s"}`;

  if (filters.length === 0) {
    return `Searched ${searchScope} with default filters.`;
  }

  return `Searched ${searchScope} using ${filters.join(", ")}`;
}

export function SearchDestinationsToolCard({
  args,
}: SearchDestinationsToolCardProps) {
  return (
    <ToolCallCard>
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src="/magnifying-glass.png"
          alt="Magnifying glass"
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>Searched destinations</ToolCallCard.Title>
          <ToolCallCard.Description>
            {formatSearchDestinationsSummary(args)}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
