'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * The checkbox primitive — a native `<input type="checkbox">` with the themed
 * look and a visible focus ring. Native on purpose: it's in the tab order,
 * toggles on Space, and reports its checked/indeterminate state to assistive
 * tech without any ARIA wiring.
 *
 * It owns no label; give it one via `field` or a wrapping `<label>`:
 *
 *   <label className="flex items-center gap-2">
 *     <Checkbox name="terms" /> Accept the terms
 *   </label>
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 shrink-0 cursor-pointer rounded border border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...rest}
    />
  );
});
