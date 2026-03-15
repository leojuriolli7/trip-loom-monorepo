"use client";

import type {
  ToolApprovalInterrupt,
  TripLoomMessage,
  TripLoomToolCall,
} from "@trip-loom/agents";
import { motion } from "motion/react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message as ConversationMessage,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { useChatStream } from "@/context/chat";
import { chatEnterVariants, springs } from "@/lib/motion";
import { EmptyStateSuggestions } from "./empty-state-suggestions";
import {
  isRenderableAssistantToolCall,
  isRenderableToolMessage,
  ToolCallRenderer,
} from "../tools";
import { ToolMessageRenderer } from "../tools/core/tool-message-renderer";
import { CancellationApprovalCard } from "../tools/cancellation-approval-card";
import { BookingPaymentInterruptCard } from "../tools/booking-payment-interrupt-card";
import { ItineraryApprovalCard } from "../tools/itinerary-approval-card";
import { SeatSelectionCard } from "../tools/seat-selection-card";
import {
  WebSearchToolCallCard,
  type WebSearchToolCall,
} from "../tools/web-search-tool-card";
import { TripChatSuggestions } from "./trip-chat-suggestions";
import Image from "next/image";

type AssistantMessageDisplay = {
  content: string;
  shouldRender: boolean;
  toolCalls: TripLoomToolCall[];
  webSearchCalls: WebSearchToolCall[];
};

/**
 * Extracts plain text from the LangGraph message content shape for chat bubbles.
 */
function getMessageContent(content: TripLoomMessage["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("");
}

/**
 * Narrows response metadata entries to the web-search payloads rendered as cards.
 */
function isWebSearchToolCall(output: unknown): output is WebSearchToolCall {
  return (
    typeof output === "object" &&
    output !== null &&
    "type" in output &&
    output.type === "web_search_call"
  );
}

/**
 * Centralizes the assistant-message visibility rules so empty turns are skipped in one place.
 */
function getAssistantMessageDisplay(
  message: TripLoomMessage,
): AssistantMessageDisplay {
  const content = getMessageContent(message.content).trim();
  const toolCalls =
    "tool_calls" in message && Array.isArray(message.tool_calls)
      ? message.tool_calls.filter(isRenderableAssistantToolCall)
      : [];
  const webSearchCalls = Array.isArray(message.response_metadata?.output)
    ? message.response_metadata.output.filter(isWebSearchToolCall)
    : [];

  return {
    content,
    toolCalls,
    webSearchCalls,
    shouldRender:
      content.length > 0 || toolCalls.length > 0 || webSearchCalls.length > 0,
  };
}

const CANCELLATION_TOOLS = new Set([
  "cancel_hotel_booking",
  "cancel_flight_booking",
]);

function ToolApprovalInterruptCard({
  interrupt,
  disabled,
  onApprove,
  onReject,
}: {
  interrupt: ToolApprovalInterrupt;
  disabled?: boolean;
  onApprove: () => void;
  onReject: (message?: string) => void;
}) {
  if (CANCELLATION_TOOLS.has(interrupt.toolName)) {
    return (
      <CancellationApprovalCard
        interrupt={interrupt}
        disabled={disabled}
        onApprove={onApprove}
        onReject={onReject}
      />
    );
  }

  return (
    <ItineraryApprovalCard
      interrupt={interrupt}
      disabled={disabled}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
}

export function ChatConversation() {
  const { messages, stream, submitResume, tripId } = useChatStream();

  return (
    <Conversation data-testid="chat-conversation" className="min-h-0 flex-1">
      {!messages?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={springs.gentle}
          className="w-full min-h-full flex-1 flex flex-col gap-4 items-center justify-center"
        >
          <Image
            width={192}
            height={192}
            alt="Destination"
            src="/aztec-temple.png"
            className="w-48 h-48"
          />

          <p className="text-muted-foreground text-sm">
            No messages yet. Start planning your trip by chatting with our
            agents.
          </p>

          <EmptyStateSuggestions />
        </motion.div>
      ) : null}

      <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
        {messages.map((message, index) => {
          const key = message.id ?? `${message.type}-${index}`;

          if (message.type === "human") {
            return (
              <motion.div
                key={key}
                initial={chatEnterVariants.hidden}
                animate={chatEnterVariants.visible}
                transition={springs.snappy}
              >
                <ConversationMessage from="user">
                  <MessageContent>
                    <MessageResponse>
                      {getMessageContent(message.content)}
                    </MessageResponse>
                  </MessageContent>
                </ConversationMessage>
              </motion.div>
            );
          }

          if (message.type === "ai") {
            const { content, toolCalls, webSearchCalls, shouldRender } =
              getAssistantMessageDisplay(message);

            if (!shouldRender) {
              return null;
            }

            return (
              <motion.div
                key={key}
                initial={chatEnterVariants.hidden}
                animate={chatEnterVariants.visible}
                transition={springs.snappy}
                className="space-y-3"
              >
                {webSearchCalls.map((webSearchCall, webSearchIndex) => (
                  <WebSearchToolCallCard
                    key={`${key}-web-search-call-${webSearchCall.id || webSearchIndex}`}
                    toolCall={webSearchCall}
                  />
                ))}

                {toolCalls.map((toolCall, toolIndex) => (
                  <ToolCallRenderer
                    key={`${key}-tool-call-${toolIndex}`}
                    toolCall={toolCall}
                  />
                ))}

                {content.length > 0 && (
                  <ConversationMessage from="assistant">
                    <MessageContent>
                      <MessageResponse>{content}</MessageResponse>
                    </MessageContent>
                  </ConversationMessage>
                )}
              </motion.div>
            );
          }

          if (message.type === "tool") {
            if (!isRenderableToolMessage(message)) {
              return null;
            }

            return (
              <motion.div
                key={key}
                initial={chatEnterVariants.hidden}
                animate={chatEnterVariants.visible}
                transition={springs.snappy}
              >
                <ToolMessageRenderer message={message} />
              </motion.div>
            );
          }

          return null;
        })}

        {stream.interrupts.map((interrupt, index) => {
          const value = interrupt.value;
          const key = interrupt.id ?? `interrupt-${index}`;

          if (value?.type === "request-seat-selection") {
            return (
              <motion.div
                key={key}
                initial={chatEnterVariants.hidden}
                animate={chatEnterVariants.visible}
                transition={springs.snappy}
              >
                <SeatSelectionCard
                  value={value}
                  disabled={stream.isLoading}
                  onConfirm={(seatId) => submitResume({ seatId })}
                  onCancel={() => submitResume({ seatId: null })}
                />
              </motion.div>
            );
          }

          if (value?.type === "request-booking-payment") {
            return (
              <motion.div
                key={key}
                initial={chatEnterVariants.hidden}
                animate={chatEnterVariants.visible}
                transition={springs.snappy}
              >
                <BookingPaymentInterruptCard
                  interrupt={value}
                  tripId={tripId}
                  disabled={stream.isLoading}
                  onPaid={() => submitResume({ status: "paid" })}
                  onCancel={() => submitResume({ status: "cancelled" })}
                />
              </motion.div>
            );
          }

          return null;
        })}

        {stream.interrupts.some(
          (i) =>
            i.value?.type !== "request-seat-selection" &&
            i.value?.type !== "request-booking-payment",
        ) && (
          <motion.div
            initial={chatEnterVariants.hidden}
            animate={chatEnterVariants.visible}
            transition={springs.snappy}
            className="space-y-3 rounded-lg border border-border/60 bg-card p-4"
          >
            <h3 className="text-sm font-medium">Awaiting confirmation</h3>

            {stream.interrupts.map((interrupt, index) => {
              const value = interrupt.value;
              const key = interrupt.id ?? `interrupt-${index}`;

              if (value?.type === "request-seat-selection") {
                return null;
              }

              if (value?.type === "tool-approval") {
                return (
                  <ToolApprovalInterruptCard
                    key={key}
                    interrupt={value}
                    disabled={stream.isLoading}
                    onApprove={() => submitResume({ approved: true })}
                    onReject={(message) =>
                      submitResume({ approved: false, message })
                    }
                  />
                );
              }

              return (
                <pre key={key} className="overflow-x-auto text-xs">
                  {JSON.stringify(interrupt, null, 2)}
                </pre>
              );
            })}
          </motion.div>
        )}

        <TripChatSuggestions />
      </ConversationContent>
    </Conversation>
  );
}
