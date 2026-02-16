/// <reference types="node" />
import { seedDataSchema } from "./validate";
import destinationsData from "./data/destinations.json";
import hotelsData from "./data/hotels.json";

console.log("Validating seed data...");

try {
  const validated = seedDataSchema.parse({
    destinations: destinationsData,
    hotels: hotelsData,
  });

  console.log(`Found ${validated.destinations.length} destinations`);
  console.log(`Found ${validated.hotels.length} hotels`);

  // Validate hotel destinationIds reference valid destinations
  const destinationIds = new Set(validated.destinations.map((d) => d.id));
  const invalidHotels = validated.hotels.filter(
    (h) => !destinationIds.has(h.destinationId),
  );

  if (invalidHotels.length > 0) {
    console.error(
      `Found ${invalidHotels.length} hotels with invalid destinationId:`,
    );
    invalidHotels.forEach((h) => {
      console.error(`  - ${h.name} (destinationId: ${h.destinationId})`);
    });
    process.exit(1);
  }

  // Count hotels per destination
  const hotelCounts = new Map<string, number>();
  validated.hotels.forEach((h) => {
    hotelCounts.set(
      h.destinationId,
      (hotelCounts.get(h.destinationId) || 0) + 1,
    );
  });

  console.log("\nHotels per destination:");
  validated.destinations.forEach((d) => {
    const count = hotelCounts.get(d.id) || 0;
    const warning = count < 5 ? " ⚠️ (< 5 hotels)" : "";
    console.log(`  ${d.name}: ${count}${warning}`);
  });

  console.log("\nValidation passed!");
} catch (err) {
  console.error("Validation failed:", err);
  process.exit(1);
}
