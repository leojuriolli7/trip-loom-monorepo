"use client";

import { useStream } from "@langchain/langgraph-sdk/react";
import type { TripLoomChatState, TripLoomStreamBag } from "@trip-loom/agents";

export const useTypedTripLoomStream = useStream<
  TripLoomChatState,
  TripLoomStreamBag
>;

export type TripLoomStream = ReturnType<typeof useTypedTripLoomStream>;
