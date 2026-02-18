/// <reference types="node" />
import "dotenv/config";
import { db } from "../src/db";
import {
  airport,
  destination,
  hotel,
  flightBooking,
  hotelBooking,
  itineraryActivity,
  itineraryDay,
  itinerary,
  trip,
} from "../src/db/schema";
import { seedDataSchema } from "./lib/data-schemas";
import { normalizeAirportRows } from "./lib/airport-normalizer";
import airportsData from "./data/airports.json";
import destinationsData from "./data/destinations.json";
import hotelsData from "./data/hotels.json";
import { logAirportNormalizationSummary } from "./lib/log-airport-summary";

const args = process.argv.slice(2);
const isClean = args.includes("--clean");
const isValidateOnly = args.includes("--validate-only");
const AIRPORT_BATCH_SIZE = 500;
const DESTINATION_BATCH_SIZE = 500;
const HOTEL_BATCH_SIZE = 500;

async function seed() {
  console.log("Validating seed data...");

  const rawAirportRows = Array.isArray(airportsData)
    ? (airportsData as unknown[])
    : [];
  const airportNormalization = normalizeAirportRows(rawAirportRows);

  const validated = seedDataSchema.parse({
    airports: airportsData,
    destinations: destinationsData,
    hotels: hotelsData,
  });

  logAirportNormalizationSummary(airportNormalization.summary);
  console.log(`Found ${validated.destinations.length} destinations`);
  console.log(`Found ${validated.hotels.length} hotels`);

  if (isValidateOnly) {
    console.log("Validation passed! (--validate-only mode, no data inserted)");
    process.exit(0);
  }

  if (isClean) {
    console.log("Cleaning existing data...");
    // Delete in FK-safe order (dependents first)
    // 1. Itinerary chain
    await db.delete(itineraryActivity);
    await db.delete(itineraryDay);
    await db.delete(itinerary);
    // 2. Bookings (reference trips, hotels, airports)
    await db.delete(flightBooking);
    await db.delete(hotelBooking);
    // 3. Trips (reference destinations)
    await db.delete(trip);
    // 4. Seed tables
    await db.delete(hotel);
    await db.delete(destination);
    await db.delete(airport);
    console.log("Existing data cleared.");
  }

  if (validated.airports.length > 0) {
    console.log("Inserting airports...");
    for (
      let index = 0;
      index < validated.airports.length;
      index += AIRPORT_BATCH_SIZE
    ) {
      const batch = validated.airports.slice(index, index + AIRPORT_BATCH_SIZE);
      await db.insert(airport).values(batch).onConflictDoNothing();
    }
    console.log(`Inserted ${validated.airports.length} airports.`);
  }

  // Insert destinations
  if (validated.destinations.length > 0) {
    console.log("Inserting destinations...");
    for (
      let index = 0;
      index < validated.destinations.length;
      index += DESTINATION_BATCH_SIZE
    ) {
      const batch = validated.destinations.slice(
        index,
        index + DESTINATION_BATCH_SIZE,
      );
      await db.insert(destination).values(batch).onConflictDoNothing();
    }
    console.log(`Inserted ${validated.destinations.length} destinations.`);
  }

  // Insert hotels
  if (validated.hotels.length > 0) {
    console.log("Inserting hotels...");
    for (
      let index = 0;
      index < validated.hotels.length;
      index += HOTEL_BATCH_SIZE
    ) {
      const batch = validated.hotels.slice(index, index + HOTEL_BATCH_SIZE);
      await db.insert(hotel).values(batch).onConflictDoNothing();
    }
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
