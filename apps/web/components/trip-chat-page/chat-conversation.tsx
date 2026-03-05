"use client";

import type { TripLoomMessage, TripLoomToolCall } from "@trip-loom/agents";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message as ConversationMessage,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { useChatStream } from "@/context/chat";
import { ToolCallRenderer } from "../tools";
import {
  WebSearchToolCallCard,
  type WebSearchToolCall,
} from "../tools/web-search-tool-card";

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
      ? message.tool_calls
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

export function ChatConversation() {
  const { messages, stream, submitResume } = useChatStream();

  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
        {messages.map((message, index) => {
          const key = message.id ?? `${message.type}-${index}`;

          if (message.type === "human") {
            return (
              <ConversationMessage key={key} from="user">
                <MessageContent>
                  <MessageResponse>
                    {getMessageContent(message.content)}
                  </MessageResponse>
                </MessageContent>
              </ConversationMessage>
            );
          }

          if (message.type === "ai") {
            const { content, toolCalls, webSearchCalls, shouldRender } =
              getAssistantMessageDisplay(message);

            if (!shouldRender) {
              return null;
            }

            return (
              <div key={key} className="space-y-3">
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
              </div>
            );
          }

          return null;
        })}

        {stream.interrupts.length > 0 && (
          <div className="space-y-3 rounded-lg border border-border/60 bg-card p-4">
            <h3 className="text-sm font-medium">Awaiting confirmation</h3>

            {stream.interrupts.map((interrupt, index) => {
              const value = interrupt.value;
              const key = interrupt.id ?? `interrupt-${index}`;

              if (value?.type === "request-confirmation") {
                return (
                  <div key={key} className="space-y-3 rounded-md border p-3">
                    <p className="text-sm">{value.summary}</p>
                    <div className="flex gap-2">
                      <Button
                        disabled={stream.isLoading}
                        onClick={() => {
                          void submitResume({ confirmed: true });
                        }}
                        size="sm"
                      >
                        Confirm
                      </Button>
                      <Button
                        disabled={stream.isLoading}
                        onClick={() => {
                          void submitResume({ confirmed: false });
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                );
              }

              if (value?.type === "request-payment") {
                return (
                  <div key={key} className="space-y-3 rounded-md border p-3">
                    <p className="text-sm">
                      {value.summary} ({value.currency} {value.amount})
                    </p>
                    <div className="flex gap-2">
                      <Button
                        disabled={stream.isLoading}
                        onClick={() => {
                          void submitResume({ status: "paid" });
                        }}
                        size="sm"
                      >
                        Mark paid
                      </Button>
                      <Button
                        disabled={stream.isLoading}
                        onClick={() => {
                          void submitResume({ status: "cancelled" });
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Cancel payment
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <pre key={key} className="overflow-x-auto text-xs">
                  {JSON.stringify(interrupt, null, 2)}
                </pre>
              );
            })}
          </div>
        )}
      </ConversationContent>
    </Conversation>
  );
}
