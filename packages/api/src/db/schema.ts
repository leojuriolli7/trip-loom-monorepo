import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  date,
  real,
  index,
  unique,
  check,
  customType,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// =============================================================================
// Custom Types
// =============================================================================

/**
 * Custom tsvector type for PostgreSQL full-text search.
 * The actual column will be maintained by a trigger (see migration).
 */
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// =============================================================================
// Enums
// =============================================================================

export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "upcoming",
  "current",
  "past",
  "cancelled",
]);

export const flightTypeEnum = pgEnum("flight_type", ["outbound", "inbound"]);

export const cabinClassEnum = pgEnum("cabin_class", [
  "economy",
  "business",
  "first",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const priceRangeEnum = pgEnum("price_range", [
  "budget",
  "moderate",
  "upscale",
  "luxury",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
]);

export const travelInterestEnum = pgEnum("travel_interest", [
  "beaches",
  "culture",
  "food",
  "nightlife",
  "adventure",
  "history",
  "nature",
  "shopping",
  "relaxation",
  "architecture",
  "wildlife",
  "mountains",
  "islands",
  "temples",
  "art",
  "wine",
  "skiing",
  "diving",
  "hiking",
  "photography",
]);

export const amenityEnum = pgEnum("amenity", [
  "wifi",
  "pool",
  "spa",
  "gym",
  "restaurant",
  "bar",
  "parking",
  "airport-shuttle",
  "room-service",
  "concierge",
  "beach-access",
  "pet-friendly",
  "business-center",
  "kids-club",
  "laundry",
  "air-conditioning",
  "balcony",
  "ocean-view",
  "city-view",
]);

export const regionEnum = pgEnum("region", [
  "Europe",
  "East Asia",
  "Southeast Asia",
  "South Asia",
  "North America",
  "South America",
  "Central America",
  "Caribbean",
  "Middle East",
  "North Africa",
  "Sub-Saharan Africa",
  "Oceania",
  "Central Asia",
]);

// =============================================================================
// Auth Tables (Better Auth - existing)
// =============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =============================================================================
// Airport
// =============================================================================

export const airport = pgTable(
  "airport",
  {
    code: text("code").primaryKey(), // IATA/ICAO code, e.g. "JFK" or "KJFK"
    icao: text("icao"),
    name: text("name").notNull(),
    city: text("city"),
    countryCode: text("country_code").notNull(), // ISO 3166-1 alpha-2
    continent: text("continent"),
    timezone: text("timezone").notNull(), // IANA timezone
    latitude: real("latitude"),
    longitude: real("longitude"),
    elevationFt: integer("elevation_ft"),
    airportType: text("airport_type"),
    scheduledService: boolean("scheduled_service").notNull().default(false),
    runwayLength: integer("runway_length"),
    wikipedia: text("wikipedia"),
    website: text("website"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("airport_country_code_idx").on(table.countryCode),
    index("airport_continent_idx").on(table.continent),
    index("airport_timezone_idx").on(table.timezone),
  ],
);

// =============================================================================
// Destination
// =============================================================================

export const destination = pgTable(
  "destination",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(), // ISO 3166-1 alpha-2
    region: regionEnum("region"), // e.g., "Caribbean", "Southeast Asia"
    timezone: text("timezone").notNull(), // IANA timezone
    latitude: real("latitude"),
    longitude: real("longitude"),
    imageUrl: text("image_url"),
    description: text("description"),
    highlights: travelInterestEnum("highlights").array(), // e.g., ["beaches", "nightlife"]
    bestTimeToVisit: text("best_time_to_visit"),
    // Full-text search vector - maintained by trigger
    searchVector: tsvector("search_vector"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("destination_country_code_idx").on(table.countryCode),
    index("destination_region_idx").on(table.region),
    index("destination_coordinates_idx").on(table.latitude, table.longitude),
    index("destination_search_vector_idx").using("gin", table.searchVector),
  ],
);

// =============================================================================
// Hotel
// =============================================================================

export const hotel = pgTable(
  "hotel",
  {
    id: text("id").primaryKey(),
    destinationId: text("destination_id")
      .notNull()
      .references(() => destination.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    imageUrl: text("image_url"),
    source: text("source"),
    sourceId: text("source_id"),
    starRating: integer("star_rating").notNull(), // 1-5
    amenities: amenityEnum("amenities").array().notNull(), // e.g., ["pool", "spa"]
    priceRange: priceRangeEnum("price_range").notNull(),
    avgPricePerNightInCents: integer("avg_price_per_night_in_cents").notNull(),
    description: text("description"),
    // Full-text search vector - maintained by trigger
    searchVector: tsvector("search_vector"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("hotel_destination_id_idx").on(table.destinationId),
    index("hotel_price_range_idx").on(table.priceRange),
    index("hotel_star_rating_idx").on(table.starRating),
    index("hotel_source_idx").on(table.source),
    index("hotel_search_vector_idx").using("gin", table.searchVector),
    unique("hotel_source_source_id_unique").on(table.source, table.sourceId),
    check(
      "hotel_star_rating_check",
      sql`${table.starRating} >= 1 AND ${table.starRating} <= 5`,
    ),
    check(
      "hotel_avg_price_non_negative",
      sql`${table.avgPricePerNightInCents} >= 0`,
    ),
  ],
);

// =============================================================================
// Trip
// =============================================================================

export const trip = pgTable(
  "trip",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    destinationId: text("destination_id").references(() => destination.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    status: tripStatusEnum("status").notNull().default("draft"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("trip_user_id_idx").on(table.userId),
    index("trip_status_idx").on(table.status),
    check(
      "trip_dates_check",
      sql`${table.endDate} IS NULL OR ${table.startDate} IS NULL OR ${table.startDate} <= ${table.endDate}`,
    ),
  ],
);

// =============================================================================
// User Preference
// =============================================================================

export const userPreference = pgTable(
  "user_preference",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    preferredCabinClass: cabinClassEnum("preferred_cabin_class"),
    budgetRange: priceRangeEnum("budget_range"),
    travelInterests: travelInterestEnum("travel_interests")
      .array()
      .notNull()
      .default([]),
    preferredRegions: regionEnum("preferred_regions")
      .array()
      .notNull()
      .default([]),
    dietaryRestrictions: text("dietary_restrictions")
      .array()
      .notNull()
      .default([]),
    accessibilityNeeds: text("accessibility_needs"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique("user_preference_user_id_unique").on(table.userId)],
);

// =============================================================================
// Payment
// =============================================================================

export const payment = pgTable(
  "payment",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    amountInCents: integer("amount_in_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    description: text("description"),
    refundedAmountInCents: integer("refunded_amount_in_cents")
      .notNull()
      .default(0),
    metadata: text("metadata"), // JSON string for additional Stripe metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("payment_trip_id_idx").on(table.tripId),
    unique("payment_stripe_payment_intent_id_unique").on(
      table.stripePaymentIntentId,
    ),
    check("payment_amount_non_negative", sql`${table.amountInCents} >= 0`),
    check(
      "payment_refunded_amount_non_negative",
      sql`${table.refundedAmountInCents} >= 0`,
    ),
  ],
);

// =============================================================================
// Stripe Webhook Event (for idempotency)
// =============================================================================

export const stripeWebhookEvent = pgTable("stripe_webhook_event", {
  id: text("id").primaryKey(), // Stripe event ID
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  payload: text("payload"), // JSON string for troubleshooting
});

// =============================================================================
// Flight Booking
// =============================================================================

export const flightBooking = pgTable(
  "flight_booking",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    paymentId: text("payment_id").references(() => payment.id, {
      onDelete: "set null",
    }),
    type: flightTypeEnum("type").notNull(),
    flightNumber: text("flight_number").notNull(),
    airline: text("airline").notNull(),
    departureAirportCode: text("departure_airport_code")
      .notNull()
      .references(() => airport.code, { onDelete: "restrict" }),
    departureCity: text("departure_city").notNull(),
    departureTime: timestamp("departure_time", {
      withTimezone: true,
    }).notNull(),
    arrivalAirportCode: text("arrival_airport_code")
      .notNull()
      .references(() => airport.code, { onDelete: "restrict" }),
    arrivalCity: text("arrival_city").notNull(),
    arrivalTime: timestamp("arrival_time", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    seatNumber: text("seat_number"),
    cabinClass: cabinClassEnum("cabin_class").notNull(),
    priceInCents: integer("price_in_cents").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("flight_booking_trip_id_idx").on(table.tripId),
    index("flight_booking_departure_airport_code_idx").on(
      table.departureAirportCode,
    ),
    index("flight_booking_arrival_airport_code_idx").on(
      table.arrivalAirportCode,
    ),
    check("flight_booking_price_non_negative", sql`${table.priceInCents} >= 0`),
    check(
      "flight_booking_duration_positive",
      sql`${table.durationMinutes} > 0`,
    ),
  ],
);

// =============================================================================
// Hotel Booking
// =============================================================================

export const hotelBooking = pgTable(
  "hotel_booking",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    hotelId: text("hotel_id")
      .notNull()
      .references(() => hotel.id, { onDelete: "restrict" }),
    paymentId: text("payment_id").references(() => payment.id, {
      onDelete: "set null",
    }),
    checkInDate: date("check_in_date").notNull(),
    checkOutDate: date("check_out_date").notNull(),
    roomType: text("room_type").notNull(),
    numberOfNights: integer("number_of_nights").notNull(),
    pricePerNightInCents: integer("price_per_night_in_cents").notNull(),
    totalPriceInCents: integer("total_price_in_cents").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("hotel_booking_trip_id_idx").on(table.tripId),
    check(
      "hotel_booking_dates_check",
      sql`${table.checkOutDate} > ${table.checkInDate}`,
    ),
    check("hotel_booking_nights_positive", sql`${table.numberOfNights} > 0`),
    check(
      "hotel_booking_price_per_night_non_negative",
      sql`${table.pricePerNightInCents} >= 0`,
    ),
    check(
      "hotel_booking_total_price_non_negative",
      sql`${table.totalPriceInCents} >= 0`,
    ),
  ],
);

// =============================================================================
// Itinerary
// =============================================================================

export const itinerary = pgTable(
  "itinerary",
  {
    id: text("id").primaryKey(),
    tripId: text("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // One itinerary per trip (1:1)
    unique("itinerary_trip_id_unique").on(table.tripId),
  ],
);

// =============================================================================
// Itinerary Day
// =============================================================================

export const itineraryDay = pgTable(
  "itinerary_day",
  {
    id: text("id").primaryKey(),
    itineraryId: text("itinerary_id")
      .notNull()
      .references(() => itinerary.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(), // 1, 2, 3...
    date: date("date").notNull(),
    title: text("title"),
    notes: text("notes"), // Markdown supported
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("itinerary_day_itinerary_id_idx").on(table.itineraryId),
    // Unique day number per itinerary
    unique("itinerary_day_unique").on(table.itineraryId, table.dayNumber),
    check("itinerary_day_number_positive", sql`${table.dayNumber} > 0`),
  ],
);

// =============================================================================
// Itinerary Activity
// =============================================================================

export const itineraryActivity = pgTable(
  "itinerary_activity",
  {
    id: text("id").primaryKey(),
    itineraryDayId: text("itinerary_day_id")
      .notNull()
      .references(() => itineraryDay.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(), // For drag-and-drop reordering
    title: text("title").notNull(),
    description: text("description"),
    startTime: text("start_time"), // "09:00" format
    endTime: text("end_time"), // "11:00" format
    location: text("location"),
    locationUrl: text("location_url"), // Google Maps link
    estimatedCostInCents: integer("estimated_cost_in_cents"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("itinerary_activity_day_id_idx").on(table.itineraryDayId),
    // Unique order index per day
    unique("itinerary_activity_order_unique").on(
      table.itineraryDayId,
      table.orderIndex,
    ),
    check(
      "itinerary_activity_order_non_negative",
      sql`${table.orderIndex} >= 0`,
    ),
    check(
      "itinerary_activity_cost_non_negative",
      sql`${table.estimatedCostInCents} IS NULL OR ${table.estimatedCostInCents} >= 0`,
    ),
  ],
);

// =============================================================================
// Relations
// =============================================================================

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  trips: many(trip),
  preference: one(userPreference, {
    fields: [user.id],
    references: [userPreference.userId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const airportRelations = relations(airport, ({ many }) => ({
  departingFlights: many(flightBooking, {
    relationName: "flightDepartureAirport",
  }),
  arrivingFlights: many(flightBooking, {
    relationName: "flightArrivalAirport",
  }),
}));

export const destinationRelations = relations(destination, ({ many }) => ({
  hotels: many(hotel),
  trips: many(trip),
}));

export const hotelRelations = relations(hotel, ({ one, many }) => ({
  destination: one(destination, {
    fields: [hotel.destinationId],
    references: [destination.id],
  }),
  bookings: many(hotelBooking),
}));

export const tripRelations = relations(trip, ({ one, many }) => ({
  user: one(user, {
    fields: [trip.userId],
    references: [user.id],
  }),
  destination: one(destination, {
    fields: [trip.destinationId],
    references: [destination.id],
  }),
  flightBookings: many(flightBooking),
  hotelBookings: many(hotelBooking),
  payments: many(payment),
  itinerary: one(itinerary, {
    fields: [trip.id],
    references: [itinerary.tripId],
  }),
}));

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userId],
    references: [user.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
  trip: one(trip, {
    fields: [payment.tripId],
    references: [trip.id],
  }),
  flightBookings: many(flightBooking),
  hotelBookings: many(hotelBooking),
}));

export const flightBookingRelations = relations(flightBooking, ({ one }) => ({
  trip: one(trip, {
    fields: [flightBooking.tripId],
    references: [trip.id],
  }),
  payment: one(payment, {
    fields: [flightBooking.paymentId],
    references: [payment.id],
  }),
  departureAirport: one(airport, {
    relationName: "flightDepartureAirport",
    fields: [flightBooking.departureAirportCode],
    references: [airport.code],
  }),
  arrivalAirport: one(airport, {
    relationName: "flightArrivalAirport",
    fields: [flightBooking.arrivalAirportCode],
    references: [airport.code],
  }),
}));

export const hotelBookingRelations = relations(hotelBooking, ({ one }) => ({
  trip: one(trip, {
    fields: [hotelBooking.tripId],
    references: [trip.id],
  }),
  hotel: one(hotel, {
    fields: [hotelBooking.hotelId],
    references: [hotel.id],
  }),
  payment: one(payment, {
    fields: [hotelBooking.paymentId],
    references: [payment.id],
  }),
}));

export const itineraryRelations = relations(itinerary, ({ one, many }) => ({
  trip: one(trip, {
    fields: [itinerary.tripId],
    references: [trip.id],
  }),
  days: many(itineraryDay),
}));

export const itineraryDayRelations = relations(
  itineraryDay,
  ({ one, many }) => ({
    itinerary: one(itinerary, {
      fields: [itineraryDay.itineraryId],
      references: [itinerary.id],
    }),
    activities: many(itineraryActivity),
  }),
);

export const itineraryActivityRelations = relations(
  itineraryActivity,
  ({ one }) => ({
    day: one(itineraryDay, {
      fields: [itineraryActivity.itineraryDayId],
      references: [itineraryDay.id],
    }),
  }),
);
