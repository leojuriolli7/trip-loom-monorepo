import { z, type ZodType } from "zod";

// Error response schema (used across all endpoints)
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

// Paginated response wrapper
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

export type PaginatedResponse<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Creates a Zod schema that accepts either a single value or an array,
 * normalizing to always produce an array. Useful for query params that
 * should support `?highlight=food&highlight=art` or `?highlight=food`.
 */
export function arrayQueryParam<T extends ZodType>(schema: T) {
  return z
    .union([schema, z.array(schema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .optional();
}
