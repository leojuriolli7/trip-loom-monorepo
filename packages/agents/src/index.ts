// Instrument LangChain/LangGraph at import time — patches callbacks to emit
// OTEL spans. Uses the host's global TracerProvider (no provider registered here).
import { instrumentLangChain } from "./lib/instrumentation";
instrumentLangChain();

export { instrumentLangChain } from "./lib/instrumentation";

export { initPersistence } from "./persistence";

export {
  TRIP_LOOM_TOOL_NAMES,
  TRANSFER_TOOL_NAMES,
  type TripLoomToolName,
  type TransferToolName,
} from "./tools/core";

export type {
  BookingPaymentInterrupt,
  ToolApprovalInterrupt,
  ToolApprovalResume,
  TripLoomMessage,
  TripLoomResumePayload,
  TripLoomChatState,
  TripLoomStreamBag,
  TripLoomToolArgsByName,
  TripLoomToolCall,
} from "./tools/core";

export {
  createGraph,
  getThreadState,
  type GraphConfig,
  type GraphInstance,
} from "./graph";

export {
  generateSuggestions,
  type SuggestionsContext,
} from "./suggestions";

export { Command } from "@langchain/langgraph";
