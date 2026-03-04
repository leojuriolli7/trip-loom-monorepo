"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ChatProvider, useChatStream } from "@/context/chat";
import { tripQueries } from "@/lib/api/react-query/trips";
import { ChatConversation } from "./chat-conversation";
import { ChatInputPanel } from "./chat-input-panel";

function AutoSubmitFromSearchParam() {
  const router = useRouter();
  const submittedRef = useRef(false);
  const { submitMessage } = useChatStream();

  useEffect(() => {
    if (submittedRef.current) {
      return;
    }

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const message = searchParams.get("message")?.trim();

    if (!message) {
      return;
    }

    submittedRef.current = true;

    void submitMessage(message).finally(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [submitMessage, router]);

  return null;
}

export function TripChatPage() {
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const { data: tripResult, status: tripStatus } = useQuery({
    ...tripQueries.getTripById(tripId),
    enabled: Boolean(tripId),
  });

  const { data: historyResult, status: historyStatus } = useQuery({
    ...tripQueries.getChatHistory(tripId),
    enabled: Boolean(tripId),
  });

  if (tripStatus === "pending" || historyStatus === "pending") {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (tripStatus === "error" || historyStatus === "error") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Could not load this chat right now.
      </div>
    );
  }

  return (
    <ChatProvider
      key={tripResult!.data!.id}
      tripId={tripResult!.data!.id}
      initialMessages={historyResult.messages}
    >
      <div className="relative flex h-full min-h-0 flex-col">
        <Suspense>
          <AutoSubmitFromSearchParam />
        </Suspense>

        <ChatConversation />
        <ChatInputPanel />
      </div>
    </ChatProvider>
  );
}
