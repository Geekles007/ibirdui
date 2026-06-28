'use client';

/**
 * Live use-case previews. Each entry mounts the REAL registry component (synced
 * into registry-preview/ by scripts/copy-registry.mjs) inside a `.ibird-preview`
 * surface, so what the reader interacts with is the actual shipped component —
 * not a mock-up. The demos around it are richly designed and animated with
 * framer-motion (entrance staggers, springs, animated counters, hover/tap) to
 * make each use case feel alive and worth poking at. Every use case pairs an
 * interactive `Demo` with the `code` that shows the component's real API.
 *
 * Covered: async-button. (accordion, tabs and the Couche 8 overlay family are
 * temporarily disabled — re-add them by importing the synced source and
 * registering their use cases below.)
 */
import { AsyncButton } from '@/registry-preview/async-button';
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import * as React from 'react';

export interface UseCase {
  /** Stable id, unique within a component. */
  id: string;
  /** Short label for the use-case switcher. */
  title: string;
  /** One line on what this case demonstrates. */
  blurb: string;
  /** The source that produced the demo, shown beside it. */
  code: string;
  /** The live, interactive demo. */
  Demo: React.ComponentType;
}

/** Resolve after `ms`, or reject if `fail`. Stands in for a real request. */
const wait = (ms: number, fail = false) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error('nope')) : resolve()), ms),
  );

/* ── shared building blocks ────────────────────────────────────────────── */

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.07, rotate: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 16 }}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/40 text-sm font-semibold text-primary-foreground shadow-sm ${className ?? ''}`}
    >
      {initials}
    </motion.div>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ── async-button ──────────────────────────────────────────────────────── */

/** A polished "save settings" card; the AsyncButton owns the pending state. */
function SaveCard({ fail, disabled }: { fail?: boolean; disabled?: boolean }) {
  const [saved, setSaved] = React.useState(false);
  const reduce = useReducedMotion();
  const controls = useAnimationControls();

  const onClick = () => {
    setSaved(false);
    const p = wait(900, fail);
    p.then(
      () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1700);
      },
      () => {
        if (!reduce) controls.start({ x: [0, -7, 6, -4, 3, 0], transition: { duration: 0.4 } });
      },
    );
    return p;
  };

  return (
    <motion.div animate={controls} className="w-80 rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar initials="AL" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">Ada Lovelace</div>
          <div className="truncate text-xs text-muted-foreground">ada@ibird.ui</div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        Display name, email and notification preferences.
      </div>
      <div className="mt-4 flex h-9 items-center gap-3">
        <AsyncButton
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          errorLabel="Couldn’t save — try again"
          className="border-none"
        >
          Save changes
        </AsyncButton>
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6, x: -6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 520, damping: 24 }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <CheckIcon /> Saved
            </motion.span>
          )}
        </AnimatePresence>
        {disabled && <span className="text-xs text-muted-foreground">No changes yet</span>}
      </div>
    </motion.div>
  );
}

function AsyncButtonSuccess() {
  return <SaveCard />;
}
function AsyncButtonError() {
  return <SaveCard fail />;
}
function AsyncButtonDisabled() {
  return <SaveCard disabled />;
}

export const previews: Record<string, UseCase[]> = {
  'async-button': [
    {
      id: 'success',
      title: 'Async save',
      blurb:
        'Return a promise and the button owns the pending state — spinner, disabled, aria-busy, success announced.',
      Demo: AsyncButtonSuccess,
      code: `<AsyncButton onClick={() => save(form)}>
  Save changes
</AsyncButton>`,
    },
    {
      id: 'error',
      title: 'Failure',
      blurb:
        'When the promise rejects, the button re-enables and announces errorLabel to screen readers.',
      Demo: AsyncButtonError,
      code: `<AsyncButton
  onClick={() => save(form)}        // rejects
  errorLabel="Couldn't save — try again"
>
  Save changes
</AsyncButton>`,
    },
    {
      id: 'disabled',
      title: 'Disabled',
      blurb: 'A plain disabled button — no click, no pending state.',
      Demo: AsyncButtonDisabled,
      code: '<AsyncButton disabled>Save changes</AsyncButton>',
    },
  ],
};
