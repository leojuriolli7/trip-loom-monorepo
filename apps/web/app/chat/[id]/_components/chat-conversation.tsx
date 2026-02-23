"use client";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { AirplaneSeatView } from "@/components/tools-ui/airplane-seat-view";
import { mockMessages } from "../../_mocks";

export function ChatConversation() {
  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
        {mockMessages.map((msg) => (
          <Message key={msg.id} from={msg.from}>
            <MessageContent>
              <MessageResponse>{msg.content}</MessageResponse>
              {msg.widget?.type === "seat-picker" && (
                <div className="mt-4">
                  <AirplaneSeatView
                    title="Flight Suggestion"
                    flight={msg.widget.data.flight}
                    onConfirm={(seatId, seatPriceInCents) => {
                      console.log(
                        `Confirmed seat ${seatId} for $${seatPriceInCents / 100}`,
                      );
                    }}
                    onCancel={() => {
                      console.log("Cancelled seat selection");
                    }}
                    onRequestChanges={(message) => {
                      console.log(`Request changes: ${message}`);
                    }}
                  />
                </div>
              )}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
}
