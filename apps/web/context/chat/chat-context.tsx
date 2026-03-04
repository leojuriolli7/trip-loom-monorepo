"use client";

import { FetchStreamTransport } from "@langchain/langgraph-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatHistoryResponse, ChatMessageDTO } from "@trip-loom/api/dto";
import type {
  TripLoomChatState,
  TripLoomMessage,
  TripLoomResumePayload,
  TripLoomStreamBag,
} from "@trip-loom/agents";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { tripQueries } from "@/lib/api/react-query/trips";
import {
  useTypedTripLoomStream,
  type TripLoomStream,
} from "./typed-chat-stream";

type ChatContextValue = {
  tripId: string;
  stream: TripLoomStream;
  messages: TripLoomMessage[];
  submitMessage: (text: string) => Promise<void>;
  submitResume: (resume: TripLoomResumePayload) => Promise<void>;
};

type ChatProviderProps = {
  tripId: string;
  initialMessages: ChatMessageDTO[];
  children: React.ReactNode;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  tripId,
  initialMessages,
  children,
}: ChatProviderProps) {
  const queryClient = useQueryClient();
  const historyMessages = useMemo(() => initialMessages, [initialMessages]);

  const syncChatHistoryCache = useCallback(
    (messages: TripLoomMessage[]) => {
      queryClient.setQueryData(tripQueries.getChatHistory(tripId).queryKey, {
        messages,
      } satisfies ChatHistoryResponse);
    },
    [queryClient, tripId],
  );

  const invalidateTripCaches = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...tripQueries.base(), "list"],
      }),
      queryClient.invalidateQueries({
        queryKey: [...tripQueries.base(), "detail", tripId],
      }),
    ]);
  }, [queryClient, tripId]);

  const transport = useMemo(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
    }

    return new FetchStreamTransport<TripLoomChatState, TripLoomStreamBag>({
      apiUrl: `${apiBaseUrl}/api/trips/${tripId}/chat`,
      onRequest: async (_url, init) => ({
        ...init,
        credentials: "include",
      }),
    });
  }, [tripId]);

  const initialValues = useMemo<TripLoomChatState>(
    () => ({ messages: historyMessages }),
    [historyMessages],
  );

  const stream = useTypedTripLoomStream({
    transport,
    threadId: tripId,
    initialValues,
    onToolEvent: (toolEvent) => {
      if (
        toolEvent.event === "on_tool_end" &&
        toolEvent.name === "update_trip"
      ) {
        invalidateTripCaches();
      }
    },
  });
  const messages =
    stream.values?.messages?.length > 0
      ? stream.values?.messages
      : historyMessages;
  const wasLoadingRef = useRef(stream.isLoading);

  useEffect(() => {
    if (wasLoadingRef.current && !stream.isLoading) {
      syncChatHistoryCache(stream.values.messages);
    }

    wasLoadingRef.current = stream.isLoading;
  }, [stream.isLoading, stream.values.messages, syncChatHistoryCache]);

  const submitMessage = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message) return;

      const optimisticMessage: TripLoomMessage = {
        content: message,
        id: crypto.randomUUID(),
        type: "human",
      };

      await stream.submit(
        {
          messages: [{ content: message, type: "human" }],
        },
        {
          optimisticValues: {
            messages: [...messages, optimisticMessage],
          },
        },
      );
    },
    [messages, stream],
  );

  const submitResume = useCallback(
    async (resume: TripLoomResumePayload) => {
      await stream.submit(null, {
        command: { resume },
        optimisticValues: {
          messages: [...messages],
        },
      });
    },
    [messages, stream],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      stream,
      submitMessage,
      submitResume,
      tripId,
    }),
    [messages, stream, submitMessage, submitResume, tripId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStream() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatStream must be used within <ChatProvider />");
  }
  return ctx;
}
