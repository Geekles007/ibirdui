'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-muted text-foreground hover:opacity-80',
  outline: 'border border-input bg-background text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  link: 'text-primary underline-offset-4 hover:underline',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-9 gap-2 rounded-md px-4 text-sm',
  lg: 'h-10 gap-2 rounded-md px-6 text-base',
  icon: 'h-9 w-9 rounded-md',
};

const BASE =
  'inline-flex shrink-0 items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60';

/**
 * Compose the class string for a button-shaped element. Exposed so other items
 * (or a link styled as a button) can reuse the exact look without rendering a
 * `<button>`:
 *
 *   <a href="/x" className={buttonClasses({ variant: 'outline' })}>Go</a>
 */
export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  const { variant = 'default', size = 'md', className } = opts ?? {};
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * The plain, synchronous button primitive — variants and sizes only, no state.
 * It's a native `<button>`, so it's keyboard- and screen-reader-accessible by
 * default; this item just adds the themed look and a visible focus ring.
 *
 * For an action that runs a promise (spinner, disabled-while-pending,
 * announced result), reach for `async-button` instead.
 *
 *   <Button>Save</Button>
 *   <Button variant="outline" size="sm">Cancel</Button>
 *   <Button variant="destructive">Delete</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    />
  );
});
