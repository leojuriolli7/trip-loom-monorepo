import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres/store";

/**
 * Creates a LangGraph checkpointer backed by PostgreSQL.
 * Stores conversation state (messages, tool calls, graph state) per thread.
 */
export function createCheckpointer(connectionString: string): PostgresSaver {
  return PostgresSaver.fromConnString(connectionString);
}

/**
 * Creates a LangGraph store backed by PostgreSQL.
 * Used for cross-session memory (user preferences, behavioral signals)
 * namespaced by userId.
 */
export function createStore(connectionString: string): PostgresStore {
  return PostgresStore.fromConnString(connectionString);
}

/**
 * Initializes both the checkpointer and store tables.
 * Safe to call multiple times — both `setup()` calls are idempotent
 * (they CREATE TABLE IF NOT EXISTS).
 *
 * Must be called once on server startup before any agent usage.
 */
export async function initPersistence(connectionString: string): Promise<{
  checkpointer: PostgresSaver;
  store: PostgresStore;
}> {
  const checkpointer = createCheckpointer(connectionString);
  const store = createStore(connectionString);

  await Promise.all([checkpointer.setup(), store.setup()]);

  return { checkpointer, store };
}
