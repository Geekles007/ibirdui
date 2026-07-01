'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * The checkbox primitive — a native `<input type="checkbox">` styled to match
 * the theme. Native on purpose: it's in the tab order, toggles on Space, and
 * reports its checked/indeterminate state to assistive tech without any ARIA
 * wiring. `appearance-none` drops the OS look so the box fills with `primary`
 * when checked; the check and indeterminate glyphs are decorative overlays
 * (`aria-hidden`) driven by the input's own `:checked` / `:indeterminate` state.
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
    <span className={cn('relative inline-flex h-4 w-4 shrink-0 align-middle', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-input bg-background shadow-xs outline-none transition-[color,box-shadow] checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
      {/* Checkmark — shown only when :checked (and not indeterminate). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100 peer-indeterminate:opacity-0"
      >
        <path d="M3.5 8.5 6.5 11.5 12.5 5" />
      </svg>
      {/* Indeterminate dash — shown only when :indeterminate. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 peer-indeterminate:opacity-100"
      >
        <path d="M4 8h8" />
      </svg>
    </span>
  );
});
