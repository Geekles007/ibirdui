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
 * stepper, plus the cross-dependency data components — state-boundary, data-list,
 * data-table (each fed a live `AsyncState` that walks loading → success/empty/
 * error) — and the full-screen portals — toast, confirm-dialog. Those two render
 * `position: fixed` overlays that would otherwise cover the whole docs page, so
 * they mount inside `PortalStage`, a wrapper that traps the overlay in the
 * sandbox (see its comment for the containing-block trick).
 */
import { Accordion, AccordionItem } from '@/registry-preview/accordion';
import type { AsyncState } from '@/registry-preview/async-state';
import { AsyncButton } from '@/registry-preview/async-button';
import { confirm, ConfirmDialog } from '@/registry-preview/confirm-dialog';
import { DataList } from '@/registry-preview/data-list';
import { type Column, DataTable } from '@/registry-preview/data-table';
import { DropdownMenu, MenuItem, MenuSeparator } from '@/registry-preview/dropdown-menu';
import { Popover } from '@/registry-preview/popover';
import { StateBoundary } from '@/registry-preview/state-boundary';
import { Step, Stepper } from '@/registry-preview/stepper';
import { Tab, Tabs } from '@/registry-preview/tabs';
import { toast, Toaster } from '@/registry-preview/toast';
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

/* ── async data scenes (state-boundary · data-list · data-table) ───────────── */

const ctrlBtn =
  'rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface Member {
  id: string;
  name: string;
  role: string;
  initials: string;
}
// Module-level so the reference is stable — a scene's fetch effect keys off it.
const TEAM: Member[] = [
  { id: 'u1', name: 'Ada Lovelace', role: 'Maintainer', initials: 'AL' },
  { id: 'u2', name: 'Grace Hopper', role: 'Admin', initials: 'GH' },
  { id: 'u3', name: 'Alan Turing', role: 'Member', initials: 'AT' },
];

interface Pkg {
  id: string;
  name: string;
  downloads: number;
  updated: string;
}
const PACKAGES: Pkg[] = [
  { id: 'p1', name: '@ibirdui/core', downloads: 48213, updated: 'Jul 12' },
  { id: 'p2', name: '@ibirdui/cli', downloads: 12904, updated: 'Jul 18' },
  { id: 'p3', name: '@ibirdui/mcp', downloads: 3821, updated: 'Jul 19' },
  { id: 'p4', name: '@ibirdui/icons', downloads: 20517, updated: 'Jul 05' },
];

type Outcome = 'success' | 'empty' | 'error';

/**
 * Drives a fake fetch: starts in `loading`, and `run(outcome)` re-enters loading
 * then resolves to the chosen state after a beat. The error variant carries a
 * working `retry` (→ success), so the component's retry affordance is real.
 */
function useAsyncScene<T>(data: T, delay = 850) {
  const [state, setState] = React.useState<AsyncState<T>>({ status: 'loading' });
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = React.useCallback(
    (outcome: Outcome) => {
      clearTimeout(timer.current);
      setState({ status: 'loading' });
      timer.current = setTimeout(() => {
        setState(
          outcome === 'success'
            ? { status: 'success', data }
            : outcome === 'empty'
              ? { status: 'empty' }
              : {
                  status: 'error',
                  error: new Error('Network request failed'),
                  retry: () => run('success'),
                },
        );
      }, delay);
    },
    [data, delay],
  );

  // Kick off the opening loading → success on mount (and on every Replay remount).
  React.useEffect(() => {
    run('success');
    return () => clearTimeout(timer.current);
  }, [run]);

  return { state, run };
}

function SceneControls({ run }: { run: (o: Outcome) => void }) {
  return (
    <div role="group" aria-label="Simulate a fetch" className="mb-3 flex flex-wrap gap-1.5">
      <button type="button" className={ctrlBtn} onClick={() => run('success')}>
        Refetch
      </button>
      <button type="button" className={ctrlBtn} onClick={() => run('empty')}>
        Empty
      </button>
      <button type="button" className={ctrlBtn} onClick={() => run('error')}>
        Error
      </button>
    </div>
  );
}

/** A member row (avatar + name + role), staggered in on entrance. */
function MemberRow({ m, i }: { m: Member; i: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05, type: 'spring', stiffness: 500, damping: 30 }}
      className="flex items-center gap-3"
    >
      <Avatar initials={m.initials} />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
        <div className="text-xs text-muted-foreground">{m.role}</div>
      </div>
    </motion.div>
  );
}

/* ── state-boundary ────────────────────────────────────────────────────────── */

/** One boundary, every state — the primitive that makes a component state-complete. */
function StateBoundaryStates() {
  const [state, setState] = React.useState<AsyncState<Member[]>>({
    status: 'success',
    data: TEAM,
  });
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const load = () => {
    clearTimeout(timer.current);
    setState({ status: 'loading' });
    timer.current = setTimeout(() => setState({ status: 'success', data: TEAM }), 850);
  };

  const states: Array<[string, () => void]> = [
    ['Loading', () => setState({ status: 'loading' })],
    ['Empty', () => setState({ status: 'empty' })],
    [
      'Error',
      () => setState({ status: 'error', error: new Error('Could not load team'), retry: load }),
    ],
    ['Success', () => setState({ status: 'success', data: TEAM })],
  ];

  return (
    <div className="w-80">
      <div role="group" aria-label="Pick a state" className="mb-3 flex flex-wrap gap-1.5">
        {states.map(([label, onClick]) => (
          <button key={label} type="button" className={ctrlBtn} onClick={onClick}>
            {label}
          </button>
        ))}
      </div>
      <StateBoundary state={state}>
        {(members) => (
          <ul className="divide-y rounded-md border">
            {members.map((m, i) => (
              <li key={m.id} className="px-3 py-2.5">
                <MemberRow m={m} i={i} />
              </li>
            ))}
          </ul>
        )}
      </StateBoundary>
    </div>
  );
}

/* ── data-list ─────────────────────────────────────────────────────────────── */

function DataListTeam() {
  const { state, run } = useAsyncScene(TEAM);
  return (
    <div className="w-80">
      <SceneControls run={run} />
      <DataList state={state} label="Team members" getKey={(m) => m.id} skeletonCount={3}>
        {(m, i) => <MemberRow m={m} i={i} />}
      </DataList>
    </div>
  );
}

/* ── data-table ────────────────────────────────────────────────────────────── */

const packageColumns: Column<Pkg>[] = [
  {
    key: 'name',
    header: 'Package',
    sortable: true,
    cell: (p) => <span className="font-medium text-foreground">{p.name}</span>,
  },
  {
    key: 'downloads',
    header: 'Downloads',
    sortable: true,
    align: 'right',
    sortValue: (p) => p.downloads,
    cell: (p) => <span className="tabular-nums">{p.downloads.toLocaleString()}</span>,
  },
  { key: 'updated', header: 'Updated', align: 'right' },
];

function DataTablePackages() {
  const { state, run } = useAsyncScene(PACKAGES);
  return (
    <div className="w-[440px] max-w-full">
      <SceneControls run={run} />
      <DataTable
        state={state}
        columns={packageColumns}
        getKey={(p) => p.id}
        label="Packages"
        loadingRows={4}
      />
    </div>
  );
}

/* ── portal sandbox ────────────────────────────────────────────────────────── */

function WindowDots() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1.5">
      {['#f87171', '#fbbf24', '#34d399'].map((c) => (
        <span
          key={c}
          style={{ width: 9, height: 9, borderRadius: 999, background: c, opacity: 0.5 }}
        />
      ))}
    </span>
  );
}

/**
 * A mini "app window" the portal components mount into. Toast and confirm-dialog
 * render `position: fixed` overlays (`fixed inset-0`, a `z-[100]` toast stack) that
 * are anchored to the viewport by default — inside the docs that would blanket the
 * whole page. Setting `transform` on this box makes IT the containing block for any
 * fixed descendant, so the overlay anchors here instead; `overflow: hidden` then
 * clips it to the frame. Net effect: the real, unmodified component behaves exactly
 * as shipped, just contained to the sandbox.
 */
function PortalStage({
  label,
  children,
  height = 300,
  width = 460,
}: {
  label: string;
  children: React.ReactNode;
  height?: number;
  width?: number;
}) {
  return (
    <div
      className="text-foreground"
      style={{
        position: 'relative',
        // A DEFINITE width (not `min(100%, …)`): the stage is a shrink-to-fit flex
        // item, so a percentage width would collapse to its content's min-content
        // and clip the fixed toast/dialog. `maxWidth` keeps it inside narrow columns.
        width,
        maxWidth: '100%',
        height,
        overflow: 'hidden',
        borderRadius: 14,
        border: '1px solid hsl(var(--border))',
        background: 'hsl(var(--background))',
        transform: 'translateZ(0)', // ← establishes the fixed-positioning containing block
        boxShadow: '0 18px 40px -24px rgba(0,0,0,.55)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 36,
          padding: '0 12px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--muted) / 0.35)',
        }}
      >
        <WindowDots />
        <span
          style={{
            fontFamily: '"Geist Mono", monospace',
            fontSize: 11.5,
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          height: height - 36,
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const primaryBtn =
  'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/* ── toast ─────────────────────────────────────────────────────────────────── */

function ToastPromise() {
  const [fail, setFail] = React.useState(false);
  // Clear the module-level stack when leaving, so a switch of use case is clean.
  React.useEffect(() => () => toast.dismissAll(), []);
  return (
    <PortalStage label="app.ibird.ui — Settings" height={280}>
      <Toaster position="bottom-right" />
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          className={primaryBtn}
          onClick={() =>
            toast.promise(wait(1500, fail), {
              loading: 'Saving changes…',
              success: 'Changes saved',
              error: 'Couldn’t save — try again',
            })
          }
        >
          Save changes
        </button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
          Make it fail
        </label>
      </div>
    </PortalStage>
  );
}

function ToastTypes() {
  React.useEffect(() => () => toast.dismissAll(), []);
  return (
    <PortalStage label="app.ibird.ui" height={280}>
      <Toaster position="bottom-right" />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={ctrlBtn}
          onClick={() => toast.success('Copied to clipboard')}
        >
          Success
        </button>
        <button type="button" className={ctrlBtn} onClick={() => toast.error('Upload failed')}>
          Error
        </button>
        <button type="button" className={ctrlBtn} onClick={() => toast.info('3 new updates')}>
          Info
        </button>
        <button
          type="button"
          className={ctrlBtn}
          onClick={() => {
            const id = toast.loading('Deploying…');
            wait(1600).then(() => {
              toast.dismiss(id);
              toast.success('Deployed to production');
            });
          }}
        >
          Loading → done
        </button>
      </div>
    </PortalStage>
  );
}

/* ── confirm-dialog ────────────────────────────────────────────────────────── */

function ConfirmAsync() {
  const [fail, setFail] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  return (
    <PortalStage label="Projects" height={320}>
      <ConfirmDialog />
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={async () => {
            setResult(null);
            const ok = await confirm({
              title: 'Delete “Aurora”?',
              description: 'This permanently removes the project and its 24 deployments.',
              destructive: true,
              confirmLabel: 'Delete project',
              action: () => wait(1200, fail),
            });
            setResult(ok ? 'Project deleted' : 'Cancelled');
          }}
        >
          Delete project
        </button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
          Make the action fail
        </label>
        <div aria-live="polite" className="h-4 text-xs font-medium text-foreground">
          {result}
        </div>
      </div>
    </PortalStage>
  );
}

function ConfirmSimple() {
  const [result, setResult] = React.useState<string | null>(null);
  return (
    <PortalStage label="Editor" height={300}>
      <ConfirmDialog />
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          className={primaryBtn}
          onClick={async () => {
            const ok = await confirm({
              title: 'Discard changes?',
              description: 'Your unsaved edits will be lost.',
              confirmLabel: 'Discard',
              cancelLabel: 'Keep editing',
            });
            setResult(ok ? 'Changes discarded' : 'Still editing');
          }}
        >
          Discard changes
        </button>
        <div aria-live="polite" className="h-4 text-xs font-medium text-foreground">
          {result}
        </div>
      </div>
    </PortalStage>
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
  'state-boundary': [
    {
      id: 'states',
      title: 'Every state',
      blurb:
        'One boundary maps idle/loading/empty/error/success onto the right slot — polite announcement, aria-busy, and focus moved to retry on error.',
      Demo: StateBoundaryStates,
      code: `<StateBoundary state={team}>
  {(members) => <MemberList data={members} />}
</StateBoundary>

// team: AsyncState<Member[]>
//   loading → skeleton (aria-busy)
//   empty   → "No results"
//   error   → message + focused Try again`,
    },
  ],
  'data-list': [
    {
      id: 'async',
      title: 'Async list',
      blurb:
        'Skeletons shaped like rows while loading, a dedicated empty slot, error + retry, and the result count announced — you only write the happy-path row.',
      Demo: DataListTeam,
      code: `<DataList
  state={team}            // AsyncState<Member[]>
  label="Team members"
  getKey={(m) => m.id}
>
  {(m) => <MemberRow member={m} />}
</DataList>`,
    },
  ],
  'data-table': [
    {
      id: 'sortable',
      title: 'Sortable',
      blurb:
        'Sortable columns expose aria-sort and announce every change; loading shows skeleton rows. Sort cycles asc → desc → off.',
      Demo: DataTablePackages,
      code: `<DataTable
  state={packages}        // AsyncState<Pkg[]>
  label="Packages"
  getKey={(p) => p.id}
  columns={[
    { key: 'name', header: 'Package', sortable: true },
    { key: 'downloads', header: 'Downloads', sortable: true,
      align: 'right', sortValue: (p) => p.downloads },
    { key: 'updated', header: 'Updated', align: 'right' },
  ]}
/>`,
    },
  ],
  toast: [
    {
      id: 'promise',
      title: 'Promise',
      blurb:
        'Hand a promise to toast.promise and it walks loading → success/error on its own. Rendered inside a contained sandbox so the fixed stack stays put.',
      Demo: ToastPromise,
      code: `// Mount once near your root:
<Toaster />

toast.promise(save(form), {
  loading: 'Saving changes…',
  success: 'Changes saved',
  error: 'Couldn’t save — try again',
});`,
    },
    {
      id: 'types',
      title: 'Types',
      blurb:
        'Fire-and-forget success/error/info, plus a loading toast you resolve by hand. Errors get role="alert"; the rest, a polite role="status".',
      Demo: ToastTypes,
      code: `toast.success('Copied to clipboard');
toast.error('Upload failed');
toast.info('3 new updates');

const id = toast.loading('Deploying…');
await deploy();
toast.dismiss(id);
toast.success('Deployed to production');`,
    },
  ],
  'confirm-dialog': [
    {
      id: 'async',
      title: 'Async action',
      blurb:
        'await confirm(...) with an action: the button owns its pending state, and on failure the dialog stays open and shows the error instead of resolving.',
      Demo: ConfirmAsync,
      code: `// Mount once near your root:
<ConfirmDialog />

const ok = await confirm({
  title: 'Delete “Aurora”?',
  description: 'This removes the project and its deployments.',
  destructive: true,
  confirmLabel: 'Delete project',
  action: () => api.deleteProject(id),  // owns pending + error
});`,
    },
    {
      id: 'simple',
      title: 'Simple',
      blurb:
        'No action — a plain confirm that resolves true/false. Focus moves in and is trapped; Escape or an outside click cancels and restores it.',
      Demo: ConfirmSimple,
      code: `const ok = await confirm({
  title: 'Discard changes?',
  description: 'Your unsaved edits will be lost.',
  confirmLabel: 'Discard',
  cancelLabel: 'Keep editing',
});
if (ok) discard();`,
    },
  ],
};
