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
 * Covered: async-button, accordion, tabs, plus the Couche 8 overlay family —
 * tooltip, popover, dropdown-menu, stepper. Add more by importing the synced
 * source and registering its use cases below. (toast / confirm-dialog use
 * viewport-fixed portals, so they need a stage that tolerates that first.)
 */
import { Accordion, AccordionItem } from '@/registry-preview/accordion';
import { AsyncButton } from '@/registry-preview/async-button';
import { DropdownMenu, MenuItem, MenuSeparator } from '@/registry-preview/dropdown-menu';
import { Popover } from '@/registry-preview/popover';
import { Step, Stepper } from '@/registry-preview/stepper';
import { Tab, Tabs } from '@/registry-preview/tabs';
import { Tooltip } from '@/registry-preview/tooltip';
import {
  AnimatePresence,
  type Variants,
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
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

const EASE = [0.21, 0.97, 0.36, 1] as const;

/* ── shared building blocks ────────────────────────────────────────────── */

/** A stagger container + item pair, reused across demos. */
const listV: Variants = {
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const itemV: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
};

/** Wraps children so they stagger in whenever this subtree (re)mounts. */
function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={listV}
      initial={reduce ? false : 'hidden'}
      animate="show"
    >
      {children}
    </motion.div>
  );
}
function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemV}>
      {children}
    </motion.div>
  );
}

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

/** Number that counts up to `to` on mount (respects reduced motion). */
function Counter({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [v, setV] = React.useState(reduce ? to : 0);
  React.useEffect(() => {
    if (reduce) {
      setV(to);
      return;
    }
    const controls = animate(mv, to, {
      duration: 1,
      ease: 'easeOut',
      onUpdate: (x) => setV(Math.round(x)),
    });
    return () => controls.stop();
  }, [to, reduce, mv]);
  return <>{v.toLocaleString()}</>;
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
function Dot({ className }: { className?: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className ?? ''}`} />;
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

function FaqTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      {children}
    </span>
  );
}

function AccordionFaq() {
  return (
    <Accordion defaultOpen={[0]} className="w-96 bg-background shadow-sm">
      <AccordionItem
        title={<FaqTitle icon={<Dot className="bg-primary" />}>What is ibirdui?</FaqTitle>}
      >
        <Stagger className="space-y-2">
          <Item className="text-muted-foreground">
            State-complete, accessible React components distributed as registry-as-code.
          </Item>
          <Item className="font-medium text-primary">Learn the thesis →</Item>
        </Stagger>
      </AccordionItem>
      <AccordionItem
        title={<FaqTitle icon={<Dot className="bg-primary" />}>Do I own the code?</FaqTitle>}
      >
        <Stagger>
          <Item className="text-muted-foreground">
            Yes — it’s copied into your repo. No runtime dependency.
          </Item>
        </Stagger>
      </AccordionItem>
      <AccordionItem
        title={<FaqTitle icon={<Dot className="bg-primary" />}>Can I upgrade later?</FaqTitle>}
      >
        <Stagger>
          <Item className="text-muted-foreground">
            Yes, edit-aware: untouched files update in place, edited ones become a conflict to
            merge.
          </Item>
        </Stagger>
      </AccordionItem>
    </Accordion>
  );
}

function AccordionMultiple() {
  return (
    <Accordion multiple defaultOpen={[0, 1]} className="w-96 bg-background shadow-sm">
      <AccordionItem title="Shipping">
        <Stagger className="space-y-2">
          <Item className="flex items-center justify-between text-muted-foreground">
            <span>Standard</span>
            <span className="font-medium text-foreground">2–3 days</span>
          </Item>
          <Item className="flex items-center justify-between text-muted-foreground">
            <span>Express</span>
            <span className="font-medium text-foreground">Next day</span>
          </Item>
        </Stagger>
      </AccordionItem>
      <AccordionItem title="Returns">
        <Stagger>
          <Item className="text-muted-foreground">30-day, no-questions returns.</Item>
        </Stagger>
      </AccordionItem>
      <AccordionItem title="Warranty" disabled>
        <p className="m-0 text-muted-foreground">Unavailable for this item.</p>
      </AccordionItem>
    </Accordion>
  );
}

/** Skeleton → content crossfade, proving the panel content loads on first open. */
function LazyContent({ label }: { label: string }) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 850);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {ready ? (
        <motion.div
          key="ready"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <Stagger className="space-y-2">
            <Item className="flex items-center gap-2 text-foreground">
              <span className="text-primary">
                <CheckIcon />
              </span>
              {label} loaded
            </Item>
            <Item className="text-muted-foreground">Fetched on first open, then kept alive.</Item>
          </Stagger>
        </motion.div>
      ) : (
        <div key="loading" className="space-y-2 py-0.5">
          <div className="h-3 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      )}
    </AnimatePresence>
  );
}

function AccordionLazy() {
  return (
    <Accordion className="w-96 bg-background shadow-sm">
      <AccordionItem title="Overview">
        <p className="m-0 text-muted-foreground">Always-rendered content.</p>
      </AccordionItem>
      <AccordionItem title="Activity (lazy)">
        {() => <LazyContent label="Activity" />}
      </AccordionItem>
    </Accordion>
  );
}

/* ── tabs ──────────────────────────────────────────────────────────────── */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Item className="flex-1 rounded-xl border bg-muted/30 p-3 text-center">
      <div className="text-xl font-semibold tabular-nums text-foreground">
        <Counter to={value} />
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </Item>
  );
}

function ActivityRow({ who, what, when }: { who: string; what: string; when: string }) {
  return (
    <Item className="flex items-center gap-3">
      <Avatar initials={who} className="h-8 w-8 text-xs" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-foreground">{what}</div>
        <div className="text-xs text-muted-foreground">{when}</div>
      </div>
    </Item>
  );
}

function TabsBasic() {
  return (
    <Tabs label="Profile sections" className="w-96 rounded-2xl border bg-background p-4 shadow-sm">
      <Tab title="Overview">
        <Stagger className="space-y-4 pt-1">
          <Item className="flex items-center gap-3">
            <Avatar initials="GH" />
            <div>
              <div className="text-sm font-semibold text-foreground">Grace Hopper</div>
              <div className="text-xs text-muted-foreground">Compiler pioneer · Admin</div>
            </div>
          </Item>
          <div className="flex gap-2.5">
            <Stat value={128} label="Commits" />
            <Stat value={42} label="Reviews" />
            <Stat value={9} label="Projects" />
          </div>
        </Stagger>
      </Tab>
      <Tab title="Activity">
        <Stagger className="space-y-3 pt-1">
          <ActivityRow who="AL" what="Merged feat/state-boundary" when="2h ago" />
          <ActivityRow who="AT" what="Opened PR #42" when="5h ago" />
          <ActivityRow who="RP" what="Commented on data-list" when="yesterday" />
        </Stagger>
      </Tab>
      <Tab title="Settings">
        <Stagger className="space-y-2.5 pt-1">
          <Item className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-foreground">Email notifications</span>
            <Dot className="bg-primary" />
          </Item>
          <Item className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-foreground">Two-factor auth</span>
            <Dot className="bg-muted-foreground" />
          </Item>
        </Stagger>
      </Tab>
    </Tabs>
  );
}

function TabsLazy() {
  return (
    <Tabs label="Dashboard" className="w-96 rounded-2xl border bg-background p-4 shadow-sm">
      <Tab title="Summary">
        <p className="m-0 pt-1 text-muted-foreground">Loaded immediately with the page.</p>
      </Tab>
      <Tab title="Reports">
        {() => <div className="pt-1">{<LazyContent label="Reports" />}</div>}
      </Tab>
    </Tabs>
  );
}

function TabsDisabled() {
  return (
    <Tabs
      label="Billing"
      defaultIndex={1}
      className="w-96 rounded-2xl border bg-background p-4 shadow-sm"
    >
      <Tab title="Plan">
        <p className="m-0 pt-1 text-muted-foreground">Your current plan.</p>
      </Tab>
      <Tab title="Invoices">
        <Stagger className="space-y-2 pt-1">
          <Item className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-foreground">May 2026</span>
            <span className="font-medium text-primary">Paid</span>
          </Item>
          <Item className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-foreground">Apr 2026</span>
            <span className="font-medium text-primary">Paid</span>
          </Item>
        </Stagger>
      </Tab>
      <Tab title="Tax docs" disabled>
        <p className="m-0 pt-1 text-muted-foreground">Not available on your plan.</p>
      </Tab>
    </Tabs>
  );
}

/* ── small glyphs reused by the overlay demos ──────────────────────────── */

function Glyph({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
const ICON = {
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  copy: 'M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
};

/* ── tooltip ────────────────────────────────────────────────────────────── */

function IconBtn({ d, label }: { d: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-xl border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
    >
      <Glyph d={d} />
    </button>
  );
}

/** A toolbar where every icon button carries a tooltip on hover *and* focus. */
function TooltipToolbar() {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="flex items-center gap-2 rounded-2xl border bg-muted/30 p-2 shadow-sm"
      >
        <Tooltip content="Save">
          <IconBtn d={ICON.save} label="Save" />
        </Tooltip>
        <Tooltip content="Copy link">
          <IconBtn d={ICON.copy} label="Copy link" />
        </Tooltip>
        <Tooltip content="Add to favourites">
          <IconBtn d={ICON.star} label="Add to favourites" />
        </Tooltip>
        <Tooltip content="Delete — this can’t be undone">
          <IconBtn d={ICON.trash} label="Delete" />
        </Tooltip>
      </motion.div>
      <p className="m-0 text-xs text-muted-foreground">Hover a button — or Tab to it.</p>
    </div>
  );
}

/** The four placement options around a single trigger. */
function TooltipSides() {
  const sides = ['top', 'right', 'bottom', 'left'] as const;
  return (
    <div className="grid grid-cols-2 gap-3">
      {sides.map((side) => (
        <Tooltip key={side} content={`On ${side}`} side={side}>
          <button
            type="button"
            className="rounded-xl border bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            {side}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

/* ── popover ────────────────────────────────────────────────────────────── */

const FILTERS = ['Open', 'In review', 'Merged', 'Closed'];

/** A filter popover that reports its current selection back to the page. */
function PopoverFilters({ align = 'start' as 'start' | 'end' }) {
  const [picked, setPicked] = React.useState<string[]>(['Open', 'In review']);
  const toggle = (f: string) =>
    setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));
  return (
    <div className="flex flex-col items-center gap-3">
      <Popover
        label={`Filters · ${picked.length}`}
        title="Filter results"
        align={align}
        triggerClassName="rounded-xl border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50"
        className="w-auto"
      >
        <div className="w-60 space-y-1">
          {FILTERS.map((f) => (
            <label
              key={f}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/60"
            >
              <input
                type="checkbox"
                checked={picked.includes(f)}
                onChange={() => toggle(f)}
                className="h-4 w-4 accent-primary"
              />
              {f}
            </label>
          ))}
        </div>
      </Popover>
      <p className="m-0 text-xs text-muted-foreground">
        Showing:{' '}
        <span className="font-medium text-foreground">{picked.join(', ') || 'nothing'}</span>
      </p>
    </div>
  );
}

/* ── dropdown-menu ──────────────────────────────────────────────────────── */

/** A row-actions menu; the chosen action is echoed under the card. */
function DropdownActions({ align = 'start' as 'start' | 'end' }) {
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-72 items-center justify-between rounded-2xl border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar initials="GR" />
          <div>
            <div className="text-sm font-semibold text-foreground">Grace Hopper</div>
            <div className="text-xs text-muted-foreground">Maintainer</div>
          </div>
        </div>
        <DropdownMenu
          label="⋯"
          align={align}
          triggerClassName="grid h-8 w-8 place-items-center rounded-lg border bg-background text-foreground shadow-sm transition-colors hover:bg-muted/50"
        >
          <MenuItem onSelect={() => setLast('Edit')}>Edit</MenuItem>
          <MenuItem onSelect={() => setLast('Duplicate')}>Duplicate</MenuItem>
          <MenuItem onSelect={() => setLast('Share')}>Share</MenuItem>
          <MenuSeparator />
          <MenuItem onSelect={() => setLast('Archived')} disabled>
            Archive (soon)
          </MenuItem>
          <MenuItem onSelect={() => setLast('Deleted')}>Delete</MenuItem>
        </DropdownMenu>
      </div>
      <p className="m-0 text-xs text-muted-foreground">
        {last ? (
          <>
            Chose: <span className="font-medium text-foreground">{last}</span>
          </>
        ) : (
          'Open the ⋯ menu — try ↑/↓ and Enter.'
        )}
      </p>
    </div>
  );
}

/* ── stepper ────────────────────────────────────────────────────────────── */

/** A 3-step wizard whose first step validates async before advancing. */
function StepperWizard({ failEmail = false }: { failEmail?: boolean }) {
  const [done, setDone] = React.useState(false);
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="grid w-96 place-items-center gap-2 rounded-2xl border bg-background p-8 text-center shadow-sm"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon size={22} />
        </span>
        <div className="text-sm font-semibold text-foreground">You’re all set!</div>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Run it again
        </button>
      </motion.div>
    );
  }
  return (
    <div className="w-96 rounded-2xl border bg-background p-5 shadow-sm">
      <Stepper onComplete={() => setDone(true)} finishLabel="Create account">
        <Step title="Account" onNext={() => wait(800, failEmail)}>
          <p className="m-0 text-sm text-muted-foreground">
            We’ll check this email against the server before moving on
            {failEmail ? ' — and this one is already taken.' : '.'}
          </p>
          <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground">
            grace@ibird.ui
          </div>
        </Step>
        <Step title="Profile">
          <p className="m-0 text-sm text-muted-foreground">
            Panels stay mounted, so nothing you type is lost going back and forth.
          </p>
        </Step>
        <Step title="Review">
          <p className="m-0 text-sm text-muted-foreground">
            Looks good? Finish to complete the wizard.
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
      title: 'FAQ (one at a time)',
      blurb:
        'Default behaviour: opening a panel closes the others. ↑/↓ move between headers, Home/End jump.',
      Demo: AccordionFaq,
      code: `<Accordion defaultOpen={[0]}>
  <AccordionItem title="What is ibirdui?">…</AccordionItem>
  <AccordionItem title="Do I own the code?">…</AccordionItem>
  <AccordionItem title="Can I upgrade later?">…</AccordionItem>
</Accordion>`,
    },
    {
      id: 'multiple',
      title: 'Multiple + disabled',
      blurb:
        'multiple lets several panels stay open; a disabled item is skipped by mouse and keyboard.',
      Demo: AccordionMultiple,
      code: `<Accordion multiple defaultOpen={[0, 1]}>
  <AccordionItem title="Shipping">…</AccordionItem>
  <AccordionItem title="Returns">…</AccordionItem>
  <AccordionItem title="Warranty" disabled>…</AccordionItem>
</Accordion>`,
    },
    {
      id: 'lazy',
      title: 'Lazy panel',
      blurb:
        'Pass children as a function and the content (and its fetch) is created only on first open.',
      Demo: AccordionLazy,
      code: `<Accordion>
  <AccordionItem title="Overview">…</AccordionItem>
  <AccordionItem title="Activity (lazy)">
    {() => <Activity />}   {/* mounts on first open */}
  </AccordionItem>
</Accordion>`,
    },
  ],
  tabs: [
    {
      id: 'basic',
      title: 'Basic',
      blurb: 'Full ARIA tabs pattern: ←/→ move and select, Home/End jump, roving tabindex.',
      Demo: TabsBasic,
      code: `<Tabs label="Profile sections">
  <Tab title="Overview">…</Tab>
  <Tab title="Activity">…</Tab>
  <Tab title="Settings">…</Tab>
</Tabs>`,
    },
    {
      id: 'lazy',
      title: 'Lazy panel',
      blurb:
        'A function child defers its content until the tab is first viewed — the fetch runs once, on view.',
      Demo: TabsLazy,
      code: `<Tabs label="Dashboard">
  <Tab title="Summary">…</Tab>
  <Tab title="Reports">
    {() => <Reports />}    {/* fetches on first view */}
  </Tab>
</Tabs>`,
    },
    {
      id: 'disabled',
      title: 'Default + disabled',
      blurb: 'defaultIndex picks the starting tab; a disabled tab can’t be selected or focused.',
      Demo: TabsDisabled,
      code: `<Tabs label="Billing" defaultIndex={1}>
  <Tab title="Plan">…</Tab>
  <Tab title="Invoices">…</Tab>
  <Tab title="Tax docs" disabled>…</Tab>
</Tabs>`,
    },
  ],
  tooltip: [
    {
      id: 'hover-focus',
      title: 'Hover & focus',
      blurb:
        'The tip is a role="tooltip" wired via aria-describedby, so it shows on hover and on keyboard focus — Tab to a button and it appears instantly.',
      Demo: TooltipToolbar,
      code: `<Tooltip content="Delete — this can't be undone">
  <button aria-label="Delete"><TrashIcon /></button>
</Tooltip>`,
    },
    {
      id: 'sides',
      title: 'Four sides',
      blurb: 'side positions the tip around its trigger: top (default), right, bottom or left.',
      Demo: TooltipSides,
      code: `<Tooltip content="On right" side="right">
  <button>right</button>
</Tooltip>`,
    },
  ],
  popover: [
    {
      id: 'filters',
      title: 'Filter panel',
      blurb:
        'A role="dialog" anchored to its trigger: focus moves in on open, restores on close, Escape and click-outside dismiss. Non-modal — it never locks the page.',
      Demo: PopoverFilters,
      code: `<Popover label="Filters" title="Filter results">
  <FilterCheckboxes />
</Popover>`,
    },
    {
      id: 'align-end',
      title: 'Aligned end',
      blurb:
        'align="end" anchors the panel to the trigger’s end edge — handy for right-side menus.',
      Demo: () => <PopoverFilters align="end" />,
      code: `<Popover label="Filters" title="Filter results" align="end">
  <FilterCheckboxes />
</Popover>`,
    },
  ],
  'dropdown-menu': [
    {
      id: 'actions',
      title: 'Actions menu',
      blurb:
        'The ARIA menu pattern: open with click, Enter, Space or ↓; ↑/↓ move with roving tabindex, Home/End jump, Escape restores focus to the trigger. A disabled item is skipped.',
      Demo: DropdownActions,
      code: `<DropdownMenu label="⋯">
  <MenuItem onSelect={edit}>Edit</MenuItem>
  <MenuItem onSelect={duplicate}>Duplicate</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={archive} disabled>Archive (soon)</MenuItem>
  <MenuItem onSelect={remove}>Delete</MenuItem>
</DropdownMenu>`,
    },
    {
      id: 'align-end',
      title: 'Aligned end',
      blurb: 'align="end" flips the menu to open from the trigger’s right edge.',
      Demo: () => <DropdownActions align="end" />,
      code: '<DropdownMenu label="⋯" align="end">…</DropdownMenu>',
    },
  ],
  stepper: [
    {
      id: 'wizard',
      title: 'Async wizard',
      blurb:
        'Each step’s onNext runs before advancing: the Next button shows busy (aria-busy) while it resolves. All panels stay mounted, so input survives moving back and forth.',
      Demo: StepperWizard,
      code: `<Stepper onComplete={submit} finishLabel="Create account">
  <Step title="Account" onNext={() => api.checkEmail(email)}>…</Step>
  <Step title="Profile">…</Step>
  <Step title="Review">…</Step>
</Stepper>`,
    },
    {
      id: 'validation-fails',
      title: 'Validation fails',
      blurb:
        'When onNext rejects, the wizard stays on the step and surfaces the error in a role="alert" — you don’t lose your place.',
      Demo: () => <StepperWizard failEmail />,
      code: `<Step title="Account" onNext={() => api.checkEmail(email)}>
  {/* rejects → stays here, shows the error */}
</Step>`,
    },
  ],
};
