'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Class for the wrapper that positions the chevron. */
  wrapperClassName?: string;
}

/**
 * The single-select primitive — a native `<select>` with the themed look and a
 * decorative chevron. Native on purpose: the OS renders the option list, so it
 * works on touch, with the keyboard and with screen readers out of the box. The
 * chevron is `aria-hidden`. Pass `<option>`s as children and pair with `field`.
 *
 * For an async, type-ahead picker use `async-combobox`; for several values,
 * `multi-select`.
 *
 *   <Field label="Role">
 *     <Select name="role" defaultValue="member">
 *       <option value="member">Member</option>
 *       <option value="admin">Admin</option>
 *     </Select>
 *   </Field>
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, wrapperClassName, children, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-input bg-background py-1 pl-3 pr-9 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20 dark:aria-[invalid=true]:ring-destructive/40',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
});
