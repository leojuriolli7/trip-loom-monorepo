import { eq } from "drizzle-orm";
import { db } from "../db";
import { userPreference } from "../db/schema";
import { generateId } from "../lib/nanoid";
import type { UserPreferenceDTO, UserPreferenceInput } from "@trip-loom/contracts/dto/user-preferences";

export async function getOrCreateUserPreferences(
  userId: string,
): Promise<UserPreferenceDTO> {
  const existing = await db.query.userPreference.findFirst({
    where: eq(userPreference.userId, userId),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(userPreference)
    .values({
      id: generateId(),
      userId,
    })
    .returning();

  return created;
}

export async function upsertUserPreferences(
  userId: string,
  input: UserPreferenceInput,
): Promise<UserPreferenceDTO> {
  const [upserted] = await db
    .insert(userPreference)
    .values({
      id: generateId(),
      userId,
      ...input,
    })
    .onConflictDoUpdate({
      target: userPreference.userId,
      set: {
        ...input,
        updatedAt: new Date(),
      },
    })
    .returning();

  return upserted;
}
