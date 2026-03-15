import type { Transition } from "motion/react";

/**
 * Shared spring transition presets for consistent animation feel across the app.
 *
 * "snappy" — quick, responsive interactions (cards entering, suggestions appearing)
 * "smooth" — layout transitions, morphing elements
 * "gentle" — subtle background entrance animations
 */
export const springs = {
  snappy: { type: "spring", stiffness: 400, damping: 30 } as const,
  smooth: { type: "spring", stiffness: 300, damping: 28 } as const,
  gentle: { type: "spring", stiffness: 200, damping: 24 } as const,
} satisfies Record<string, Transition>;

/** Default stagger delay between sibling items (seconds). */
export const STAGGER_DELAY = 0.04;

/** Chat-enter animation variants matching the existing CSS keyframes feel. */
export const chatEnterVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const;
