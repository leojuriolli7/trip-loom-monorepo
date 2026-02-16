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

## Frontend Design

Before doing any UI work, read the `frontend-design` skill to ensure production-grade, distinctive interfaces that avoid generic AI aesthetics.

### Icons

For simple icons, we are using the `lucide-react` icons package. NEVER create custom svg's for this use-case, always use Lucide icons.

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
