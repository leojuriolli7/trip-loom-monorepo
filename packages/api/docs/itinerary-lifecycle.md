# Itinerary Lifecycle and Trip Status

This document describes how itinerary APIs behave and how itinerary changes affect trip state.

## Itinerary Data Model

- One itinerary per trip (`itinerary.trip_id` unique).
- One-to-many: itinerary -> days.
- One-to-many: day -> activities.
- Day uniqueness: `(itinerary_id, day_number)`.
- Activity uniqueness: `(itinerary_day_id, order_index)`.

## Endpoint Lifecycle

### Itinerary-level

- `GET /api/trips/:id/itinerary`
- `POST /api/trips/:id/itinerary`
- `DELETE /api/trips/:id/itinerary`

Behavior:

1. Create can include nested days and activities in one transaction.
2. Duplicate day numbers or duplicate activity order indexes in payload return `409 Conflict`.
3. Delete removes itinerary, days, and activities via cascade.

### Day-level

- `POST /api/trips/:id/itinerary/days`
- `PATCH /api/trips/:id/itinerary/days/:dayId`
- `DELETE /api/trips/:id/itinerary/days/:dayId`

Behavior:

1. Day add/update requires itinerary ownership.
2. Deleting a day renumbers remaining days (`dayNumber - 1` for later days).

### Activity-level

- `POST /api/trips/:id/itinerary/days/:dayId/activities`
- `PATCH /api/trips/:id/itinerary/days/:dayId/activities/:activityId`
- `DELETE /api/trips/:id/itinerary/days/:dayId/activities/:activityId`

Behavior:

1. Activity add/update requires day ownership.
2. Deleting an activity renumbers remaining activities in that day (`orderIndex - 1` for later activities).

## How Itinerary Affects Trip Status

Trip status refresh is driven by `hasTripTravelPlan(tripId)`, where itinerary existence counts as travel plan data.

### Operations that trigger trip refresh

- `createItinerary(...)`
- `deleteItinerary(...)`

### Operations that do not trigger trip refresh

- `addDay(...)`
- `updateDay(...)`
- `deleteDay(...)`
- `addActivity(...)`
- `updateActivity(...)`
- `deleteActivity(...)`

This is intentional because day/activity changes do not change itinerary existence.

## Practical Status Outcomes

1. Creating itinerary on a draft trip:
   - If trip has valid dates, refresh may move it to derived status (`upcoming/current/past`).
   - If dates are missing, trip can remain `draft`.
2. Deleting itinerary:
   - If no other active bookings remain, trip can move back to `draft` (unless trip is already `cancelled`).
3. Cancelled trips:
   - Automatic refresh keeps `cancelled` status (sticky under background refresh flow).

## Client Guidance

After itinerary create/delete, prefer re-fetching full trip:

- `GET /api/trips/:id`

This returns the updated aggregate:

- `itinerary`
- `flightBookings`
- `hotelBookings`
- `payments`
- `trip.status`
