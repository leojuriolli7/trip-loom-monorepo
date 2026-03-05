"use client";

import type { TripLoomMessage } from "@trip-loom/agents";
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
            const content = getMessageContent(message.content).trim();
            const toolCalls = message.tool_calls ?? [];

            const webSearchCalls = Array.isArray(
              message.response_metadata?.output,
            )
              ? message.response_metadata.output.filter(
                  (output: unknown) =>
                    typeof output === "object" &&
                    output !== null &&
                    "type" in output &&
                    output.type === "web_search_call",
                )
              : [];

            return (
              <div key={key} className="space-y-3">
                {toolCalls.map((toolCall, toolIndex: number) => (
                  <ToolCallRenderer
                    key={`${key}-tool-call-${toolIndex}`}
                    toolCall={toolCall}
                  />
                ))}

                {webSearchCalls.map(
                  (webSearchCall: unknown, webSearchIndex: number) => (
                    <div
                      key={`${key}-web-search-call-${webSearchIndex}`}
                      className="rounded-lg border border-border/60 bg-card p-4"
                    >
                      <h3 className="mb-2 text-sm font-medium">
                        Provider tool: web_search
                      </h3>
                      <pre className="overflow-x-auto text-xs">
                        {JSON.stringify(webSearchCall, null, 2)}
                      </pre>
                    </div>
                  ),
                )}

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

          if (message.type === "tool") {
            return (
              <div
                key={key}
                className="rounded-lg border border-border/60 bg-card p-4"
              >
                <h3 className="mb-2 text-sm font-medium">
                  Tool result: {message.name ?? message.tool_call_id}
                </h3>
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify(
                    {
                      content: getMessageContent(message.content),
                      status: message.status,
                    },
                    null,
                    2,
                  )}
                </pre>
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
