import type { ToolCall } from "@langchain/core/messages/tool";
import type { Interrupt, Message } from "@langchain/langgraph-sdk";
import type { TripLoomToolName } from "./registry";
import type { TripLoomInterruptValue } from "./types";

export type TripLoomToolCall = ToolCall<
  TripLoomToolName,
  Record<string, unknown>
>;

/**
 * Canonical message type for TripLoom chat state.
 */
export type TripLoomMessage = Message<TripLoomToolCall>;

/**
 * Stream state contract shared by frontend and API history mapping.
 */
export type TripLoomChatState = {
  messages: TripLoomMessage[];
  __interrupt__?: Interrupt<TripLoomInterruptValue>[];
};

/**
 * Typed bag contract for `useStream`.
 */
export type TripLoomStreamBag = {
  ConfigurableType: { thread_id?: string };
  CustomEventType: never;
  InterruptType: TripLoomInterruptValue;
  UpdateType: TripLoomChatState;
};
