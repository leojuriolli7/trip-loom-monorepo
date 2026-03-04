"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ChatProvider, useChatStream } from "@/context/chat";
import { tripQueries } from "@/lib/api/react-query/trips";
import { ChatConversation } from "./_components/chat-conversation";
import { ChatInputPanel } from "../_components/shell/chat-input-panel";

function AutoSubmitFromSearchParam() {
  const submittedRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { submitMessage } = useChatStream();

  useEffect(() => {
    if (submittedRef.current) {
      return;
    }

    const message = searchParams.get("message")?.trim();
    if (!message) {
      return;
    }

    submittedRef.current = true;
    void submitMessage(message).finally(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router, searchParams, submitMessage]);

  return null;
}

export default function ChatByIdPage() {
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const {
    data: tripResult,
    isLoading: isTripLoading,
    status: tripStatus,
  } = useQuery({
    ...tripQueries.getTripById(tripId),
    enabled: Boolean(tripId),
  });

  const {
    data: historyResult,
    isLoading: isHistoryLoading,
    status: historyStatus,
  } = useQuery({
    ...tripQueries.getChatHistory(tripId),
    enabled: Boolean(tripId),
  });

  if (isTripLoading || isHistoryLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (
    tripStatus === "error" ||
    !tripResult?.data ||
    historyStatus === "error" ||
    !historyResult
  ) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Could not load this chat right now.
      </div>
    );
  }

  return (
    <ChatProvider
      key={tripResult.data.id}
      tripId={tripResult.data.id}
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
