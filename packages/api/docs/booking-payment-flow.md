# Booking and Payment Flow

Bookings are created first as provisional records. Payment completion is what finalizes them.

## Why This Design

- We need a concrete booking target before checkout.
- Stripe confirmation is asynchronous.
- Webhooks are the source of truth for terminal payment outcomes.

## Flight and Hotel Flow

1. Create booking:
   - `POST /api/trips/:id/flights` or
   - `POST /api/trips/:id/hotels`
2. Booking is created as:
   - `status: "pending"`
   - `paymentId: null`
3. Create payment intent:
   - `POST /api/payments/create-intent`
   - Requires `tripId`, `bookingType`, and `bookingId`.
   - Server derives the authoritative amount from the booking record.
4. Confirm payment client-side with Stripe using returned `clientSecret`.
5. Optional reconciliation call:
   - `POST /api/payments/confirm`
   - Syncs only non-terminal states like `pending` and `processing`.
6. Stripe webhook finalizes:
   - `POST /api/webhooks/stripe`
   - `payment_intent.succeeded`:
     - payment becomes `succeeded`
     - booking receives `paymentId`
     - booking becomes `confirmed`
   - `payment_intent.payment_failed`:
     - payment becomes `failed`
     - booking remains `pending`

## Idempotency

Both `POST /api/trips/:id/flights` and `POST /api/trips/:id/hotels` are idempotent for active bookings:

- Before inserting, the service checks for an existing non-cancelled booking with the same key (hotel: `tripId + hotelId`, flight: `tripId + flightNumber + departureTime`).
- If found, returns the existing booking with HTTP **200** instead of creating a duplicate.
- New bookings return HTTP **201**.
- A partial unique index at the DB level (`WHERE status != 'cancelled'`) enforces this as a last line of defense.

This matters for the AI agent flow where graph re-execution after payment interrupts can cause duplicate booking attempts.

## AI Agent Integration

The AI agent system (LangGraph) drives booking creation through MCP tools. See `docs/ai/ai-booking-flow.md` for the full agent flow, tool ownership rules, and HITL interrupt mechanics.

Key points for API consumers:
- Bookings are always created as `pending` by sub-agents (hotel_agent, flight_agent)
- Payment is triggered separately by the supervisor agent via a `request_payment` interrupt
- The frontend handles Stripe checkout and resumes the graph with the payment result
- Cancellation requires explicit user confirmation via a `request_cancellation` interrupt

## Refund Flow

1. Request refund:
   - `POST /api/payments/:id/refund`
2. Full refund:
   - payment becomes `refunded`
   - linked booking(s) become `cancelled`
3. Partial refund:
   - payment becomes `partially_refunded`
   - booking stays `confirmed`
4. Webhook `charge.refunded` is also supported as authoritative sync.

## Client Read Pattern After Checkout

After Stripe confirmation in UI:

1. Poll or refresh payment:
   - `GET /api/payments/:id`
2. Refresh booking or trip aggregate:
   - `GET /api/trips/:id/flights/:flightId` or
   - `GET /api/trips/:id/hotels/:hotelBookingId` or
   - `GET /api/trips/:id` (recommended aggregate read)

This handles webhook timing without assuming instant confirmation in the same HTTP round trip.
