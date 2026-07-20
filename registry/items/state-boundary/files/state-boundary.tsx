'use client';

import type { AsyncState, AsyncStatus } from '@/lib/async-state';
import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const DEFAULT_LABELS: Record<AsyncStatus, string> = {
  idle: '',
  loading: 'Loading…',
  empty: 'No results',
  error: 'Something went wrong',
  success: 'Content loaded',
};

export interface StateBoundaryProps<T> {
  /** The async state to render. */
  state: AsyncState<T>;
  /** Render the resolved value. Only called in the `success` state. */
  children: (data: T) => React.ReactNode;
  /** Visual shown while loading. Defaults to a skeleton block. */
  loading?: React.ReactNode;
  /** Visual shown when the result is empty. */
  empty?: React.ReactNode;
  /** Visual shown on error. Receives the error and an optional retry callback. */
  error?: (error: Error, retry?: () => void) => React.ReactNode;
  /**
   * Override the screen-reader announcement for a state. Set a value to `null` to
   * announce nothing for that state — e.g. a component that owns its own live
   * region and doesn't want a second, competing one.
   */
  labels?: Partial<Record<AsyncStatus, string | null>>;
  className?: string;
}

/**
 * Maps an `AsyncState<T>` onto the matching slot and handles the accessibility
 * concerns most components skip:
 *
 *  - a polite live region announces every state transition to screen readers
 *  - `aria-busy` is set while loading
 *  - focus moves to the retry control when an error appears
 *
 * This is the primitive that makes every ibirdui component "state-complete".
 */
export function StateBoundary<T>({
  state,
  children,
  loading,
  empty,
  error,
  labels,
  className,
}: StateBoundaryProps<T>) {
  const override = labels?.[state.status];
  // `null` means "announce nothing" for this state; absent falls back to the default.
  const announceText = override === null ? '' : (override ?? DEFAULT_LABELS[state.status]);
  // Visible slots (empty / error) always show human text, never blank.
  const visibleLabel = override ?? DEFAULT_LABELS[state.status];

  // Drive the live region from an effect so it is empty at first paint and the
  // text lands as a *mutation*: a live region that already holds its text on
  // mount is not announced by screen readers.
  const [announced, setAnnounced] = React.useState('');
  React.useEffect(() => {
    setAnnounced(announceText);
  }, [announceText]);

  // Move focus to the retry button when we enter the error state, so keyboard
  // and screen-reader users land on the actionable control.
  const retryRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (state.status === 'error') retryRef.current?.focus();
  }, [state.status]);

  return (
    <div
      className={cn('ibirdui-state-boundary', className)}
      aria-busy={state.status === 'loading' || undefined}
    >
      {/* Polite live region: announced, not seen. */}
      <span role="status" aria-live="polite" className="sr-only">
        {announced}
      </span>

      {state.status === 'loading' && (loading ?? <DefaultSkeleton />)}

      {state.status === 'empty' && (empty ?? <DefaultEmpty>{visibleLabel}</DefaultEmpty>)}

      {state.status === 'error' &&
        (error ? (
          error(state.error, state.retry)
        ) : (
          <DefaultError
            ref={retryRef}
            message={state.error.message || visibleLabel}
            retry={state.retry}
          />
        ))}

      {state.status === 'success' && children(state.data)}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

function DefaultEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

const DefaultError = React.forwardRef<HTMLButtonElement, { message: string; retry?: () => void }>(
  function DefaultError({ message, retry }, ref) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
      >
        <p>{message}</p>
        {retry && (
          <button
            ref={ref}
            type="button"
            onClick={retry}
            className="inline-flex items-center rounded-md border border-destructive/40 px-3 py-1.5 font-medium transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            Try again
          </button>
        )}
      </div>
    );
  },
);
