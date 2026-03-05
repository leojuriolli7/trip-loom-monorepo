# Agent Guidelines

## Styling

Always use shadcn CSS variables when building UI. Reference the design tokens defined in `app/globals.css`:

**Colors:** `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1` through `chart-5`, and sidebar variants.

**Radius:** `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`, `radius-2xl`, `radius-3xl`, `radius-4xl`.

Use these via Tailwind classes (e.g., `bg-primary`, `text-muted-foreground`, `rounded-lg`). Never use raw color values.

## React Best Practices

Before writing React code, read the `vercel-react-best-practices` skill for performance optimization guidelines covering:

- Component memoization patterns
- Data fetching strategies
- Bundle optimization
- Next.js specific patterns

## API Communication Layer

All frontend API communication must go through the Eden treaty client in `lib/api/api-client.ts`:

```ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@trip-loom/api";

export const apiClient = treaty<App>(process.env.NEXT_PUBLIC_API_BASE_URL);
```

This is our main API layer because it gives end-to-end type safety from backend routes to frontend calls. Endpoints are consumed like typed functions (for example: `apiClient.api.user.preferences.get(...)`), so request/response contracts stay aligned with backend types.

When adding new API communication, follow the same integration pattern used in `lib/api/react-query/user-preferences.ts`: define query/mutation option factories in `lib/api/react-query/*` and consume them via TanStack React Query hooks in components.

## React Query Patterns

We standardize React Query around domain files in `lib/api/react-query/*` with query/mutation option factories and typed keys.

### Hook Result Destructuring (Required)

When consuming query hooks in components, destructure the returned fields directly instead of storing the full query object.

```tsx
const { data: trips = [], isPending, isError } = useQuery(...);
```

Avoid patterns like:

```tsx
const tripsQuery = useQuery(...);
```

### Domains

- Create one domain file per API area (`trips.ts`, `flights.ts`, `user-preferences.ts`, etc.).
- In each file, define a local `KEYS` factory and export a single `*Queries` object.
- Keep `KEYS` private to the file and expose `base: () => KEYS.base()` from the exported object.
- Name endpoint factories by intent (`list*`, `get*`, `create*`, `update*`, `delete*`).

### New Endpoints

When adding an endpoint to a domain:

1. Add a key builder to `KEYS`.
2. Add a query/mutation option factory to the exported `*Queries` object.
3. Use `queryOptions`/`infiniteQueryOptions`/`mutationOptions` from `@tanstack/react-query`.
4. Always pass `fetch: { signal }` in query functions.
5. For mutation keys with runtime IDs, use stable placeholders (for example `"any"`) in the key factory call.

### Variable Types From `apiClient` (Required)

Always derive mutation `vars` types from the treaty client method signatures. Do not redeclare request body shapes manually.

```ts
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "../api-client";

const KEYS = {
  base: () => ["hotel-bookings"],
  create: (tripId: string) => [...KEYS.base(), "create", tripId],
};

type TripsCall = ReturnType<typeof apiClient.api.trips>;

type CreateHotelBookingVars = {
  tripId: string;
  body: Parameters<TripsCall["hotels"]["post"]>[0];
};

type PutUserPreferencesVars = Parameters<
  typeof apiClient.api.user.preferences.put
>[0];

export const hotelBookingQueries = {
  base: () => KEYS.base(),
  createTripHotelBooking: () =>
    mutationOptions({
      mutationKey: KEYS.create("any"),
      mutationFn: async (vars: CreateHotelBookingVars) =>
        apiClient.api.trips({ id: vars.tripId }).hotels.post(vars.body),
    }),
};
```

For nested dynamic routes, derive from the returned call type:

```ts
type UpdateHotelBookingVars = {
  tripId: string;
  hotelBookingId: string;
  body: Parameters<ReturnType<TripsCall["hotels"]>["patch"]>[0];
};
```

Reuse the produced query key directly when reading/writing cache.
Treat these keys as tagged query keys: they carry type information for cached data operations.

```ts
queryClient.setQueryData(
  userPreferencesQueries.getUserPreferences().queryKey,
  result,
);
```

In this pattern, `setQueryData` is type-safe: passing the wrong data shape results in a TypeScript error.

### Mutations

For mutations, always call `mutateAsync` and handle the promise with `.then(...).catch(...)`. Never use `mutate` with `onSuccess`/`onError`. Follow the mutation flow shown in `components/user-preferences-dialog.tsx`.

### Polling Pattern

For polling scenarios (e.g., waiting for payment confirmation), prefer using `queryClient.fetchQuery` with the `poll` utility from `lib/poll.ts` over `useQuery` with `refetchInterval` + `useEffect`. The imperative approach is easier to read, follow, and reason about.

```tsx
import { poll } from "@/lib/poll";
import { paymentQueries } from "@/lib/api/react-query/payments";

// Inside your component/handler
await poll({
  createPromise: async () => {
    return queryClient.fetchQuery(paymentQueries.getPaymentById(paymentId));
  },
  onSuccess: (result) => {
    if (result.data?.status === "succeeded") {
      return false; // Stop polling
    }
    return true; // Continue polling
  },
  interval: 2000,
  maxAttempts: 30,
  abortSignal: abortController.signal,
});
```

See `app/dev/api-crud/_components/steps/pay-flight-step.tsx` for a full example.

## Shared DTO and Schema Reuse

Always reuse backend DTO types and schema values from `@trip-loom/contracts/dto`. Do not redefine enums, literal unions, or DTO types in `apps/web`.

```ts
import {
  cabinClassValues,
  budgetRangeValues,
  travelInterestValues,
  regionValues,
  type UserPreferenceDTO,
} from "@trip-loom/contracts/dto";
```

## Frontend Design

Before doing any UI work, read the `frontend-design` skill to ensure production-grade, distinctive interfaces that avoid generic AI aesthetics.

### Icons

For simple icons, we are using the `lucide-react` icons package. NEVER create custom svg's for this use-case, always use Lucide icons.

Do not use `SparklesIcon` in product UI. It is banned across this codebase.

For rich, detailed icons (images), we are using custom stylized, playful 3D icons. They are all localed inside the `public` folder.

- `backpack.png`: Backpack with a map hanging out of its pocket.
- `bungalow.png`: Luxury bungalow.
- `camping.png`: Camping tent.
- `classical-monument.png`: Greek-style classical monument.
- `colliseum.png`: Roman colliseum monument.
- `eiffel-golden.png`: Golden eiffel tower.
- `hotel.png`: A hotel building.
- `island.png`: Island with the sea around it.
- `luggage.png`: Wheeled luggage.
- `plane.png`: Plane on top of clouds.
- `palm-tree.png`: Island with a palm tree in the center of it.
- `pyramid.png`: Egyptian pyramid, with sun behind it.
- `statue-liberty.png`: Statue of Liberty.
- `stone-face.png`: Stonehedge-like stone face.
- `japanese-temple.png`: Ancient Japanese temple.
- `duffel.png`: Duffel bag with passport hanging out of it.
- `camera.png`: Digital camera.
- More...

If you think none fit and you need to a new icon, request the developer to generate your desired icon.

## AI User Interfaces

When building AI-related user interfaces, use components from `components/ai-elements/` before creating new ones.

## Forms

All forms are built with `react-hook-form`, `zod`, and `standardSchemaResolver` from `@hookform/resolvers/standard-schema`.

```tsx
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";

const schema = z.object({
  email: z.email("Invalid email").min(1, "Required"),
});

type FormSchema = z.infer<typeof schema>;


const form = useForm<FormSchema>({
  resolver: standardSchemaResolver(schema),
  defaultValues: { email: "" },
});
```

**Example forms:**
- `app/enter/_components/sign-up-form.tsx` - Full form with validation, password requirements UI
- `app/enter/_components/sign-in-form.tsx` - Simple form with validation

## E2E Testing

After implementing a complete feature, always write E2E tests using Playwright. See `e2e/README.md` for setup instructions, test patterns, and examples.

**Key points:**
- Use `data-testid` attributes for test selectors
- Test utilities are in `e2e/fixtures/utils.ts`
- Constants (passwords, etc.) are in `e2e/fixtures/constants.ts`
- Run tests with `pnpm test:e2e`
