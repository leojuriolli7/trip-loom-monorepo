"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SearchIcon, CheckIcon } from "lucide-react";

type InfiniteSearchListProps<T> = {
  queryKey: readonly unknown[];
  queryFn: (params: {
    search: string;
    pageParam: string | undefined;
  }) => Promise<{
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
  }>;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getItemId: (item: T) => string;
  selectedId: string | null;
  onSelect: (item: T) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
};

export function InfiniteSearchList<T>({
  queryKey,
  queryFn,
  renderItem,
  getItemId,
  selectedId,
  onSelect,
  placeholder = "Search...",
  emptyMessage = "No results found",
  className,
}: InfiniteSearchListProps<T>) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: [...queryKey, debouncedSearch],
      queryFn: ({ pageParam }) =>
        queryFn({ search: debouncedSearch, pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const items = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card">
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => {
              const id = getItemId(item);
              const isSelected = id === selectedId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    isSelected && "bg-primary/10",
                  )}
                >
                  <div className="flex-1">{renderItem(item, isSelected)}</div>
                  {isSelected && (
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
            {hasNextPage && (
              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Spinner />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
