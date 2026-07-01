'use client';

/**
 * block-motion — the shared animation language for ibirdui blocks.
 *
 * Every block in the catalogue is meant to feel "bluffant" out of the box, but
 * still be accessible and consistent. This lib gives all of them the same small
 * vocabulary so the motion reads as one product rather than twenty random
 * animations:
 *
 *   - `springs`        — the catalogue's shared spring "feel".
 *   - `reveal` / `revealItem` — stagger children into view on mount.
 *   - `popInOut` / `fade` / `slideIn` — enter/exit variants for AnimatePresence.
 *   - `layoutId`       — namespaced ids for shared-layout morphs.
 *   - `<MotionProvider>` — makes every nested animation honour the visitor's
 *     `prefers-reduced-motion` setting automatically.
 *
 * It is the only place blocks reach for animation defaults, so tuning the feel
 * of the whole catalogue happens here, once.
 */
import { MotionConfig, type Transition, type Variants } from 'framer-motion';
import type * as React from 'react';

/* ------------------------------------------------------------------- springs */

/**
 * Spring presets — the shared "feel" across the whole catalogue. Use one as the
 * `transition` on any motion element so blocks move consistently.
 */
export const springs = {
  /** Balanced default for entrances and layout shifts. */
  smooth: { type: 'spring', stiffness: 260, damping: 30 },
  /** Quick and tight — toggles, selection highlights, small UI. */
  snappy: { type: 'spring', stiffness: 420, damping: 32 },
  /** Soft and slow — hero reveals, large surfaces. */
  gentle: { type: 'spring', stiffness: 150, damping: 24 },
  /** Tuned for `layout` / shared-layout morphs (reordering, tab pills, kanban). */
  layout: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 },
} satisfies Record<string, Transition>;

export type SpringName = keyof typeof springs;

/* ----------------------------------------------------------------- 1. reveal */
// Stagger a container's children into view. Put `reveal` on the parent and
// `revealItem` on each child; the parent orchestrates the timing. Drive it with
// `initial="hidden" animate="visible"` (or `whileInView="visible"`).

/** Container variant: orchestrates the staggered entrance of its children. */
export const reveal: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** Child variant: rises and fades into place. Pairs with {@link reveal}. */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springs.smooth },
};

/** Build a custom-tempo reveal container (e.g. snappier grids, slower heroes). */
export function makeReveal(stagger = 0.06, delayChildren = 0.04): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

/* ----------------------------------------------------------- 2. enter / exit */
// For elements mounted/unmounted inside <AnimatePresence>: toasts, dialogs,
// sheets, empty states, popovers, command-palette results.

/** Pop in with a slight scale + lift; collapse back out. The default overlay feel. */
export const popInOut: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springs.snappy },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
};

/** The most restrained option — just opacity. Good for cross-fades and backdrops. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Slide in from an edge, slide back out. For sheets, drawers and toasts. */
export function slideIn(from: 'top' | 'bottom' | 'left' | 'right', distance = 24): Variants {
  const horizontal = from === 'left' || from === 'right';
  const offset = (from === 'left' || from === 'top' ? -1 : 1) * distance;
  // Keep concrete x/y keys (a computed `[axis]` key would widen the variant to
  // an index signature that no longer satisfies Framer Motion's `Variant` type).
  const at = (value: number) => (horizontal ? { x: value } : { y: value });
  return {
    hidden: { opacity: 0, ...at(offset) },
    visible: { opacity: 1, ...at(0), transition: springs.smooth },
    exit: { opacity: 0, ...at(offset), transition: { duration: 0.15 } },
  };
}

/* --------------------------------------------------------- 3. shared layout */

/**
 * Build a namespaced `layoutId` so two blocks on the same page never collide
 * when they each animate, say, a "selected" pill. Give every shared-layout
 * element the same id within a group to make Framer Motion morph one into the
 * next.
 *
 *   <motion.span layoutId={layoutId('tabs', active)} transition={springs.layout} />
 */
export function layoutId(group: string, key: string | number): string {
  return `block-motion:${group}:${key}`;
}

/* ----------------------------------------------------------------- provider */

export interface MotionProviderProps {
  children: React.ReactNode;
  /**
   * How to honour the OS "reduce motion" setting. `"user"` (the default) keeps
   * opacity/colour transitions but drops transform + layout animation when the
   * visitor asks for less motion — the accessible default for every block.
   * `"always"` forces reduced motion; `"never"` disables the behaviour.
   */
  reducedMotion?: 'user' | 'always' | 'never';
}

/**
 * Wrap a block — or your whole app — so every animation inside respects the
 * visitor's reduced-motion preference and shares the catalogue's default spring.
 * Blocks still animate without it; this just makes the accessibility fallback
 * automatic instead of something each block has to wire up itself.
 *
 *   <MotionProvider>
 *     <PricingBlock />
 *   </MotionProvider>
 */
export function MotionProvider({ children, reducedMotion = 'user' }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion={reducedMotion} transition={springs.smooth}>
      {children}
    </MotionConfig>
  );
}
