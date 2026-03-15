"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestions";
import { useChatStream } from "@/context/chat";
import { suggestionQueries } from "@/lib/api/react-query/suggestions";

export function TripChatSuggestions() {
  const { stream, messages, submitMessage, tripId } = useChatStream();
  const queryClient = useQueryClient();
  const wasLoadingRef = useRef(stream.isLoading);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const lastMessageId = messages.at(-1)?.id;
  const hasMessages = messages.length > 0;

  const fetchSuggestions = useCallback(async () => {
    // Cancel previous queries first:
    queryClient.cancelQueries({
      queryKey: suggestionQueries.base(),
      exact: false,
    });

    if (!lastMessageId) return;

    setIsFetching(true);

    try {
      const data = await queryClient.fetchQuery({
        ...suggestionQueries.getSuggestions(tripId, lastMessageId),
        staleTime: Infinity,
      });

      setSuggestions(data.suggestions);
    } catch {
      setSuggestions([]);
    } finally {
      setIsFetching(false);
    }
  }, [queryClient, tripId, lastMessageId]);

  /**
   * This effect deals with fetching on mount, when there's messages in
   * history and no active streaming happening.
   */
  useEffect(() => {
    if (hasMessages && !stream.isLoading) {
      void fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  /**
   * This effect runs whenever isLoading changes, and when stream goes from loading
   * to idle, will generate new suggestions.
   */
  useEffect(() => {
    if (stream.isLoading) {
      setSuggestions([]);
    }

    if (wasLoadingRef.current && !stream.isLoading) {
      void fetchSuggestions();
    }

    wasLoadingRef.current = stream.isLoading;
  }, [stream.isLoading, fetchSuggestions]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSuggestions([]);
      void submitMessage(suggestion);
    },
    [submitMessage],
  );

  // While streaming, fetching suggestions or no suggestions available: render nothing.
  if (stream.isLoading || suggestions.length === 0 || isFetching) {
    return null;
  }

  return (
    <Suggestions>
      {suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion}
          suggestion={suggestion}
          onClick={handleSuggestionClick}
        />
      ))}
    </Suggestions>
  );
}
