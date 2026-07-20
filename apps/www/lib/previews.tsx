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
 * Covered: async-button, accordion, tabs, tooltip, popover, dropdown-menu,
 * stepper. (Cross-dependency components — data-table, data-list, state-boundary,
 * … — and full-screen portals — toast, confirm-dialog — are still to come.)
 */
import { Accordion, AccordionItem } from '@/registry-preview/accordion';
import { AsyncButton } from '@/registry-preview/async-button';
import { DropdownMenu, MenuItem, MenuSeparator } from '@/registry-preview/dropdown-menu';
import { Popover } from '@/registry-preview/popover';
import { Step, Stepper } from '@/registry-preview/stepper';
import { Tab, Tabs } from '@/registry-preview/tabs';
import { Tooltip } from '@/registry-preview/tooltip';
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

/* ── accordion ─────────────────────────────────────────────────────────── */

function AccordionFaq() {
  return (
    <div className="w-80">
      <Accordion defaultOpen={[0]}>
        <AccordionItem title="When does my order ship?">
          <p className="text-muted-foreground">Orders placed before 2pm ship the same day.</p>
        </AccordionItem>
        <AccordionItem title="What's the return policy?">
          <p className="text-muted-foreground">30 days, no questions asked.</p>
        </AccordionItem>
        <AccordionItem title="Is there a warranty?">
          {() => (
            <p className="text-muted-foreground">
              Two years — this panel (and any fetch in it) mounts only on first open.
            </p>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/* ── tabs ──────────────────────────────────────────────────────────────── */

function TabsProfile() {
  return (
    <div className="w-80">
      <Tabs label="Profile sections">
        <Tab title="Overview">
          <p className="text-sm text-muted-foreground">
            Ada Lovelace · joined 2024 · 42 components installed.
          </p>
        </Tab>
        <Tab title="Activity">
          {() => (
            <p className="text-sm text-muted-foreground">
              Pushed 3 commits today — loaded on first view.
            </p>
          )}
        </Tab>
        <Tab title="Settings">
          <p className="text-sm text-muted-foreground">Email notifications are on.</p>
        </Tab>
      </Tabs>
    </div>
  );
}

/* ── tooltip ───────────────────────────────────────────────────────────── */

function TooltipButtons() {
  const btn =
    'rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted';
  return (
    <div className="flex items-center gap-3">
      <Tooltip content="Saved automatically">
        <button type="button" className={btn}>
          Autosave
        </button>
      </Tooltip>
      <Tooltip content="Exports a CSV" side="bottom">
        <button type="button" className={btn}>
          Export
        </button>
      </Tooltip>
    </div>
  );
}

/* ── popover ───────────────────────────────────────────────────────────── */

function PopoverFilters() {
  return (
    <Popover label="Filters" title="Filter results">
      <div className="flex flex-col gap-2 text-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" defaultChecked /> In stock
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" /> On sale
        </label>
        <button
          type="button"
          className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Apply
        </button>
      </div>
    </Popover>
  );
}

/* ── dropdown-menu ─────────────────────────────────────────────────────── */

function DropdownActions() {
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu label="Actions">
        <MenuItem onSelect={() => setLast('Edited')}>Edit</MenuItem>
        <MenuItem onSelect={() => setLast('Shared')}>Share</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => setLast('Deleted')} disabled>
          Delete
        </MenuItem>
      </DropdownMenu>
      {last && <span className="text-sm text-muted-foreground">{last}</span>}
    </div>
  );
}

/* ── stepper ───────────────────────────────────────────────────────────── */

function StepperWizard() {
  const [done, setDone] = React.useState(false);
  const input =
    'w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none';
  if (done) {
    return (
      <div className="flex w-80 items-center gap-2 text-sm font-semibold text-primary">
        <CheckIcon /> Account created
      </div>
    );
  }
  return (
    <div className="w-80">
      <Stepper onComplete={() => setDone(true)} finishLabel="Create account">
        <Step title="Email" onNext={() => wait(800)}>
          <input className={input} placeholder="you@ibird.ui" defaultValue="ada@ibird.ui" />
          <p className="mt-2 text-xs text-muted-foreground">
            Next runs an async check — the button shows busy while it resolves.
          </p>
        </Step>
        <Step title="Profile">
          <input className={input} placeholder="Display name" defaultValue="Ada Lovelace" />
        </Step>
        <Step title="Review">
          <p className="text-sm text-muted-foreground">
            Everything look right? Create your account.
          </p>
        </Step>
      </Stepper>
    </div>
  );
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
  accordion: [
    {
      id: 'faq',
      title: 'Lazy panels',
      blurb:
        'ARIA disclosure pattern; each panel — and any fetch inside it — mounts only when first opened.',
      Demo: AccordionFaq,
      code: `<Accordion defaultOpen={[0]}>
  <AccordionItem title="When does it ship?">
    <Shipping />
  </AccordionItem>
  <AccordionItem title="Warranty">
    {() => <Warranty />}   {/* mounts on open */}
  </AccordionItem>
</Accordion>`,
    },
  ],
  tabs: [
    {
      id: 'panels',
      title: 'Lazy tabs',
      blurb:
        'Roving-tabindex tablist; each panel mounts on first view, then stays alive so switching back is instant.',
      Demo: TabsProfile,
      code: `<Tabs label="Profile sections">
  <Tab title="Overview"><Overview /></Tab>
  <Tab title="Activity">{() => <Activity />}</Tab>
</Tabs>`,
    },
  ],
  tooltip: [
    {
      id: 'hover-focus',
      title: 'Hover & focus',
      blurb:
        'Shows on hover and on keyboard focus, wired via aria-describedby so screen readers hear it too.',
      Demo: TooltipButtons,
      code: `<Tooltip content="Saved automatically">
  <button>Autosave</button>
</Tooltip>`,
    },
  ],
  popover: [
    {
      id: 'panel',
      title: 'Rich content',
      blurb:
        'A role="dialog" panel on click; focus moves in, Escape or an outside click dismisses and restores it.',
      Demo: PopoverFilters,
      code: `<Popover label="Filters" title="Filter results">
  <FilterForm />
</Popover>`,
    },
  ],
  'dropdown-menu': [
    {
      id: 'actions',
      title: 'Actions menu',
      blurb:
        'The ARIA menu pattern — full keyboard nav (arrows, Home/End, Enter), with the disabled item skipped.',
      Demo: DropdownActions,
      code: `<DropdownMenu label="Actions">
  <MenuItem onSelect={edit}>Edit</MenuItem>
  <MenuItem onSelect={share}>Share</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={remove} disabled>Delete</MenuItem>
</DropdownMenu>`,
    },
  ],
  stepper: [
    {
      id: 'wizard',
      title: 'Async validation',
      blurb:
        "Each step's onNext runs before advancing — the button shows busy, and a rejection keeps you on the step.",
      Demo: StepperWizard,
      code: `<Stepper onComplete={submit} finishLabel="Create account">
  <Step title="Email" onNext={() => api.checkEmail(email)}>
    <EmailField />
  </Step>
  <Step title="Profile"><ProfileField /></Step>
  <Step title="Review"><Review /></Step>
</Stepper>`,
    },
  ],
};
