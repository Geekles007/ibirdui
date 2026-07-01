'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Current value. Omit (or pass undefined) for an indeterminate bar. */
  value?: number;
  /** Maximum value. Default 100. */
  max?: number;
  /** Accessible name when no visible label points at the bar. */
  label?: string;
}

/**
 * A progress bar following the ARIA `progressbar` pattern. Pass `value` (and
 * optionally `max`) for a determinate bar — it sets `aria-valuenow/min/max`, so
 * assistive tech reads the percentage. Omit `value` for an indeterminate bar
 * (an in-flight task of unknown length): no `aria-valuenow`, plus a sliding
 * animation that respects `prefers-reduced-motion`.
 *
 * Give it a name via `label`, `aria-label` or `aria-labelledby`.
 *
 *   <Progress value={72} label="Upload" />
 *   <Progress label="Loading" />            // indeterminate
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { value, max = 100, label, className, ...rest },
  ref,
) {
  const indeterminate = value === undefined || Number.isNaN(value);
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const pct = indeterminate ? 0 : (clamped / max) * 100;

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: progressbar is a non-interactive ARIA role and must not be focusable
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : max}
      aria-valuenow={indeterminate ? undefined : clamped}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
      {...rest}
    >
      <div
        className={cn(
          'h-full rounded-full bg-primary transition-[width] duration-500 ease-out',
          indeterminate && 'w-1/3 motion-safe:animate-[ibirdui-progress_1.2s_ease-in-out_infinite]',
        )}
        style={indeterminate ? undefined : { width: `${pct}%` }}
      />
      {indeterminate && (
        <style>
          {
            '@keyframes ibirdui-progress{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}'
          }
        </style>
      )}
    </div>
  );
});
