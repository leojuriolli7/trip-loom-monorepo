import { QueryClient } from "@tanstack/react-query";
import { tripQueries } from "./api/react-query/trips";

export const prefetchChatHistory = (
  queryClient: QueryClient,
  tripId: string,
) => {
  void queryClient.prefetchQuery(tripQueries.getChatHistory(tripId));
};
