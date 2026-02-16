"use client";
import {
  QueryClient,
  QueryClientConfig,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

const CLIENT_CONFIG: QueryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      retry: 3,
    },
    mutations: {
      retry: 3,
    },
  },
};

export function ReactQueryProvider({ children }: React.PropsWithChildren) {
  const [client] = useState(() => new QueryClient(CLIENT_CONFIG));

  return (
    <QueryClientProvider client={client}>
      {children}

      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
