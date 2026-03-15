import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

/**
 * Creates a LangGraph checkpointer backed by PostgreSQL.
 * Stores conversation state (messages, tool calls, graph state) per thread.
 */
export function createCheckpointer(connectionString: string): PostgresSaver {
  return PostgresSaver.fromConnString(connectionString);
}

/**
 * Initializes the checkpointer tables.
 * Safe to call multiple times — `setup()` is idempotent
 * (CREATE TABLE IF NOT EXISTS).
 *
 * Must be called once on server startup before any agent usage.
 */
export async function initPersistence(connectionString: string): Promise<{
  checkpointer: PostgresSaver;
}> {
  const checkpointer = createCheckpointer(connectionString);

  await checkpointer.setup();

  return { checkpointer };
}
