import type { ToolCall } from "@langchain/core/messages/tool";
import type { Interrupt, Message } from "@langchain/langgraph-sdk";
import type { ToolCallFromTool } from "@langchain/langgraph-sdk/react";
import type {
  TripLoomLocalTool,
  TripLoomMcpToolName,
  TripLoomToolName,
  TransferToolName,
} from "./registry";
import type { TripLoomMcpToolArgsByName } from "./mcp/types";
import type { TripLoomInterruptValue } from "./types";

type TripLoomMcpToolCallByName<Name extends TripLoomMcpToolName> = ToolCall<
  Name,
  TripLoomMcpToolArgsByName[Name]
>;

export type TripLoomMcpToolCall = {
  [Name in TripLoomMcpToolName]: TripLoomMcpToolCallByName<Name>;
}[TripLoomMcpToolName];

export type TripLoomLocalToolCall = ToolCallFromTool<TripLoomLocalTool>;

export type TripLoomTransferToolCall = ToolCall<
  TransferToolName,
  Record<string, never>
>;

export type TripLoomToolCall =
  | TripLoomLocalToolCall
  | TripLoomMcpToolCall
  | TripLoomTransferToolCall;

type TripLoomToolCallByName<Name extends TripLoomToolName> = Extract<
  TripLoomToolCall,
  { name: Name }
>;

export type TripLoomToolArgsByName<Name extends TripLoomToolName> =
  TripLoomToolCallByName<Name>["args"];

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
