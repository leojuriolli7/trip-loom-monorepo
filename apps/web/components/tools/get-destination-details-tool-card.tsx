import type { TripLoomToolArgsByName } from "@trip-loom/agents";
import { ToolCallCard } from "@/components/tools/tool-call-card";
import { useQuery } from "@tanstack/react-query";
import { destinationQueries } from "@/lib/api/react-query/destinations";

type GetDestinationDetailsToolCardProps = {
  args: TripLoomToolArgsByName<"get_destination_details">;
};

export function GetDestinationDetailsToolCard({
  args,
}: GetDestinationDetailsToolCardProps) {
  const { data: destinationDetails, status } = useQuery({
    ...destinationQueries.getDestinationById(args?.destinationId),
    enabled: !!args?.destinationId,
  });

  if (status !== "success") return null;

  return (
    <ToolCallCard size="lg">
      <ToolCallCard.Header>
        <ToolCallCard.Image
          src={
            destinationDetails?.data?.imagesUrls?.[0].url || "/placeholder.png"
          }
          className="object-cover rounded-2xl"
          alt={"Destination image"}
        />

        <ToolCallCard.HeaderContent>
          <ToolCallCard.Title>
            In-depth look at {destinationDetails?.data?.name}
          </ToolCallCard.Title>
          <ToolCallCard.Description>
            {destinationDetails?.data?.description}
          </ToolCallCard.Description>
        </ToolCallCard.HeaderContent>
      </ToolCallCard.Header>
    </ToolCallCard>
  );
}
