import { z } from "zod";

const cursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string().min(1),
});

type CursorInput = z.infer<typeof cursorSchema>;

const decodeCursor = (cursor: string): CursorInput =>
  cursorSchema.parse(
    JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
  );

const isValidCursor = (cursor: string): boolean => {
  try {
    decodeCursor(cursor);
    return true;
  } catch {
    return false;
  }
};

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
