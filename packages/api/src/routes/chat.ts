import { Elysia } from "elysia";
import { z } from "zod";
import { errorResponseSchema } from "@trip-loom/contracts/dto/common";
import { setLogEntityId, useLogger } from "../lib/observability";
import {
  chatInputSchema,
  chatHistoryResponseSchema,
  type ChatInput,
  type ChatInputMessage,
} from "../dto/chat";
import { extractMessageFromInput } from "../lib/chat/extract-message";
import { requireAuthMacro } from "../lib/auth/plugin";
import {
  createChatConversationRateLimit,
  createDefaultRateLimit,
} from "../lib/rate-limit";
import { BadRequestError } from "../errors";
import {
  streamChatResponse,
  resumeChatResponse,
  getChatHistory,
} from "../services/chat";

const tripIdParamSchema = z.object({
  id: z.string().min(1),
});

function normalizeChatInput(body: ChatInput): {
  message?: ChatInputMessage;
  resumeData?: unknown;
} {
  return {
    message: extractMessageFromInput(body.input),
    resumeData: body.command?.resume,
  };
}

const sseHeaders = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export const chatRoutes = new Elysia({
  name: "chat",
  prefix: "/api/trips",
})
  .use(createDefaultRateLimit())
  .use(requireAuthMacro)
  .guard({}, (app) =>
    // Specifically to the chat conversations route, we apply stricter
    // rate-limits.
    app.use(createChatConversationRateLimit()).post(
      "/:id/chat",
      async ({ user, params, body }) => {
        const log = useLogger();

        setLogEntityId(log, "trip", params.id);
        const normalized = normalizeChatInput(body);

        const { stream, threadId } =
          normalized.resumeData !== undefined
            ? await resumeChatResponse(
                user.id,
                params.id,
                normalized.resumeData,
              )
            : await (async () => {
                if (!normalized.message) {
                  throw new BadRequestError(
                    "Either input or command.resume is required",
                  );
                }

                return streamChatResponse(
                  user.id,
                  params.id,
                  normalized.message,
                );
              })();

        setLogEntityId(log, "thread", threadId);

        return new Response(stream, { headers: sseHeaders });
      },
      {
        auth: true,
        params: tripIdParamSchema,
        body: chatInputSchema,
      },
    ),
  )
  .get(
    "/:id/chat/history",
    async ({ user, params }) => {
      return getChatHistory(user.id, params.id);
    },
    {
      auth: true,
      params: tripIdParamSchema,
      response: {
        200: chatHistoryResponseSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
