/// <reference types="node" />
import "dotenv/config";
import { db } from "../src/db";
import { destination, hotel } from "../src/db/schema";
import { seedDataSchema } from "./validate";
import destinationsData from "./data/destinations.json";
import hotelsData from "./data/hotels.json";

const args = process.argv.slice(2);
const isClean = args.includes("--clean");
const isValidateOnly = args.includes("--validate-only");

async function seed() {
  console.log("Validating seed data...");

  const validated = seedDataSchema.parse({
    destinations: destinationsData,
    hotels: hotelsData,
  });

  console.log(`Found ${validated.destinations.length} destinations`);
  console.log(`Found ${validated.hotels.length} hotels`);

  if (isValidateOnly) {
    console.log("Validation passed! (--validate-only mode, no data inserted)");
    process.exit(0);
  }

  if (isClean) {
    console.log("Cleaning existing data...");
    // Delete hotels first (FK constraint)
    await db.delete(hotel);
    await db.delete(destination);
    console.log("Existing data cleared.");
  }

  // Insert destinations
  if (validated.destinations.length > 0) {
    console.log("Inserting destinations...");
    await db
      .insert(destination)
      .values(validated.destinations)
      .onConflictDoNothing();
    console.log(`Inserted ${validated.destinations.length} destinations.`);
  }

  // Insert hotels
  if (validated.hotels.length > 0) {
    console.log("Inserting hotels...");
    await db.insert(hotel).values(validated.hotels).onConflictDoNothing();
    console.log(`Inserted ${validated.hotels.length} hotels.`);
  }

  console.log("Seeding complete!");
}

seed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
