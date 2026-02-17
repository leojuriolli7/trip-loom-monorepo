# Trip Lifecycle

Trips are the center of the product. Bookings, payments, and itineraries are attached to a trip.

## Core States

- `draft`
- `upcoming`
- `current`
- `past`
- `cancelled`

## Main Rules

1. Trips are usually created as `draft`.
2. A trip cannot stay `upcoming`, `current`, or `past` unless both `startDate` and `endDate` are set.
3. Booking and itinerary mutations can trigger status re-evaluation.
4. A trip can move from `draft` to `upcoming` when it has travel plan data and valid dates.
5. Status transitions are guarded by domain rules in `src/lib/trips/rules.ts`.

## What Counts As Travel Plan Data

- At least one non-cancelled flight booking.
- At least one non-cancelled hotel booking.
- An itinerary attached to the trip.

## Practical Implication For Clients

1. Create a draft trip early, even before full details are known.
2. Set destination and dates when user intent becomes concrete.
3. Add bookings and itinerary progressively.
4. Read trip detail after mutations (`GET /api/trips/:id`) to show current aggregate state.
