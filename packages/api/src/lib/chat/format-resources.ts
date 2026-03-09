import { z } from "zod";
import { userPreferenceSchema } from "@trip-loom/contracts/dto/user-preferences";
import { tripWithDestinationSchema } from "@trip-loom/contracts/dto/trips";

/**
 * Lenient schemas that coerce dates from JSON strings.
 * MCP resources return serialized JSON where Date fields become strings.
 */
const preferencesResourceSchema = userPreferenceSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const tripResourceSchema = tripWithDestinationSchema.extend({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const tripsResponseSchema = z.object({
  data: z.array(tripResourceSchema),
});

/**
 * Parses the raw MCP preferences JSON and formats it as XML for LLM context.
 * Returns null if parsing fails or no preferences exist.
 */
export function formatPreferencesResource(raw: string): string | null {
  try {
    const prefs = preferencesResourceSchema.parse(JSON.parse(raw));

    const lines: string[] = ["<user-preferences>"];

    if (prefs.budgetRange) {
      lines.push(`  <budget-range>${prefs.budgetRange}</budget-range>`);
    }
    if (prefs.preferredCabinClass) {
      lines.push(
        `  <preferred-cabin-class>${prefs.preferredCabinClass}</preferred-cabin-class>`,
      );
    }
    if (prefs.travelInterests.length > 0) {
      lines.push(
        `  <travel-interests>${prefs.travelInterests.join(", ")}</travel-interests>`,
      );
    }
    if (prefs.preferredRegions.length > 0) {
      lines.push(
        `  <preferred-regions>${prefs.preferredRegions.join(", ")}</preferred-regions>`,
      );
    }
    if (prefs.dietaryRestrictions.length > 0) {
      lines.push(
        `  <dietary-restrictions>${prefs.dietaryRestrictions.join(", ")}</dietary-restrictions>`,
      );
    }
    if (prefs.accessibilityNeeds) {
      lines.push(
        `  <accessibility-needs>${prefs.accessibilityNeeds}</accessibility-needs>`,
      );
    }

    lines.push("</user-preferences>");

    return lines.join("\n");
  } catch {
    return null;
  }
}

/**
 * Parses the raw MCP trips JSON, filters to trips with a destination and dates,
 * and formats as XML with only the fields relevant for LLM context.
 * Returns null if no meaningful trips remain after filtering.
 */
export function formatTripsResource(raw: string): string | null {
  try {
    const { data: trips } = tripsResponseSchema.parse(JSON.parse(raw));

    const meaningful = trips.filter((t) => t.destinationId && t.startDate);

    if (meaningful.length === 0) return null;

    const lines: string[] = ["<user-trips>"];

    for (const t of meaningful) {
      lines.push("  <trip>");
      lines.push(`    <id>${t.id}</id>`);
      if (t.title) lines.push(`    <title>${t.title}</title>`);
      if (t.destination?.name) {
        lines.push(`    <destination>${t.destination.name}</destination>`);
      }
      lines.push(`    <start-date>${t.startDate}</start-date>`);
      if (t.endDate) lines.push(`    <end-date>${t.endDate}</end-date>`);

      lines.push(`    <created-at>${t.createdAt}</created-at>`);
      lines.push(`    <updated-at>${t.updatedAt}</updated-at>`);

      lines.push(`    <has-flights>${t.hasFlights}</has-flights>`);
      lines.push(`    <has-hotel>${t.hasHotel}</has-hotel>`);
      lines.push(`    <has-itinerary>${t.hasItinerary}</has-itinerary>`);
      lines.push("  </trip>");
    }

    lines.push("</user-trips>");

    return lines.join("\n");
  } catch {
    return null;
  }
}
