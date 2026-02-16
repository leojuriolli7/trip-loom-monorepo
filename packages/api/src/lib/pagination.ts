import { z } from "zod";
import { and, desc, eq, lt, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { PaginatedResponse } from "../dto/common";

// =============================================================================
// Cursor Schema
// =============================================================================

const cursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
});

type CursorInput = z.infer<typeof cursorSchema>;

const encodeCursor = (cursor: CursorInput): string =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

const decodeCursor = (cursor: string): CursorInput =>
  cursorSchema.parse(
    JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"))
  );

const isValidCursor = (cursor: string): boolean => {
  try {
    decodeCursor(cursor);
    return true;
  } catch {
    return false;
  }
};

// =============================================================================
// Query Params Schema (extend this for domain-specific queries)
// =============================================================================

/**
 * Base pagination query schema. Extend with `.extend()` for domain-specific filters.
 *
 * @example
 * ```ts
 * export const destinationQuerySchema = paginationQuerySchema.extend({
 *   region: z.string().optional(),
 *   country: z.string().optional(),
 * });
 * ```
 */
export const paginationQuerySchema = z.object({
  cursor: z
    .string()
    .optional()
    .refine((cursor) => !cursor || isValidCursor(cursor), {
      message: "Invalid cursor",
    }),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

// =============================================================================
// Query Builder Helpers
// =============================================================================

/**
 * Builds cursor condition for pagination.
 * For DESC order: gets rows where (createdAt, id) < cursor
 */
export function buildCursorCondition(
  cursor: string | undefined,
  createdAtColumn: PgColumn,
  idColumn: PgColumn
): SQL | undefined {
  if (!cursor) return undefined;

  const decoded = decodeCursor(cursor);
  return or(
    lt(createdAtColumn, new Date(decoded.createdAt)),
    and(eq(createdAtColumn, new Date(decoded.createdAt)), lt(idColumn, decoded.id))
  );
}

/**
 * Builds full-text search condition using tsvector.
 * Uses websearch syntax to safely handle user-provided query text.
 */
export function buildSearchCondition(
  searchVector: PgColumn,
  search: string | undefined
): SQL | undefined {
  if (!search?.trim()) return undefined;
  return sql`${searchVector} @@ websearch_to_tsquery('english', ${search.trim()})`;
}

/**
 * Combines multiple conditions with AND.
 * Filters out undefined conditions.
 */
export function combineConditions(
  ...conditions: (SQL | undefined)[]
): SQL | undefined {
  const validConditions = conditions.filter(
    (c): c is SQL => c !== undefined
  );
  if (validConditions.length === 0) return undefined;
  if (validConditions.length === 1) return validConditions[0];
  return and(...validConditions);
}

/**
 * Standard order by for cursor pagination: createdAt DESC, id DESC
 */
export function paginationOrderBy(
  createdAtColumn: PgColumn,
  idColumn: PgColumn
) {
  return [desc(createdAtColumn), desc(idColumn)] as const;
}

// =============================================================================
// Response Builder
// =============================================================================

/**
 * Builds paginated response from query results.
 *
 * Usage:
 * - Query must fetch `limit + 1` rows
 * - Query must use `paginationOrderBy()` for consistent ordering
 */
export function paginate<T extends { id: string; createdAt: Date | string }>(
  items: T[],
  limit: number
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextItem = hasMore ? data[data.length - 1] : null;
  const nextCursor = nextItem
    ? encodeCursor({
        id: nextItem.id,
        createdAt:
          nextItem.createdAt instanceof Date
            ? nextItem.createdAt.toISOString()
            : nextItem.createdAt,
      })
    : null;

  return { data, nextCursor, hasMore };
}
