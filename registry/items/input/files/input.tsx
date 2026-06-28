'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const BASE =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * The themed text input primitive — a native `<input>` with nothing added but
 * the look and a visible focus ring. It deliberately owns no label or error
 * markup: pair it with `field`, which injects `id`, `aria-describedby`,
 * `aria-invalid` and `aria-required` for you.
 *
 *   <Field label="Email" error={errors.email}>
 *     <Input type="email" name="email" />
 *   </Field>
 *
 * When `aria-invalid` is set (as Field does on error) the border and ring turn
 * destructive, so the error state is visible, not only announced.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cn(BASE, className)} {...rest} />;
});
