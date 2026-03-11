# Booking and Payment Flow

Bookings are created first as provisional records. Booking endpoints now also create or reuse the payment session that checkout will use.

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
3. Booking response includes:
   - booking details
   - payment session details
   - Stripe client secret / hosted checkout information when available
4. Confirm payment client-side with Stripe using returned payment-session data.
5. Stripe webhook finalizes:
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

The AI agent system (LangGraph) drives booking creation through MCP tools. See [AI Booking Flow](../ai/ai-booking-flow.md) for the full agent flow, tool ownership rules, and HITL interrupt mechanics.

Key points for API consumers:
- Booking endpoints create the pending booking and payment session together.
- The internal LangGraph app pauses inside the booking tool flow for payment rather than using a separate `request_payment` tool.
- External MCP/API consumers can use the returned payment-session data directly in their own UX.
- Cancellation tools (`cancel_hotel_booking`, `cancel_flight_booking`) still require user approval via the [tool approval pattern](../ai/tool-approval.md) before executing.

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
