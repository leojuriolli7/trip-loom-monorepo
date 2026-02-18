"use client";
import { QueryClient, QueryClientConfig } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useMemo, useState } from "react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

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

  const persister = useMemo(() => {
    return createAsyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
    });
  }, []);

  return (
    <PersistQueryClientProvider client={client} persistOptions={{ persister }}>
      {children}

      <ReactQueryDevtools />
    </PersistQueryClientProvider>
  );
}
