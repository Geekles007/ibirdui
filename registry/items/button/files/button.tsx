'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

// Flat by design (shadcn-style): filled variants carry a hairline `shadow-xs`
// and shift their fill on hover; quiet variants (outline/ghost) fill with the
// neutral `accent` surface. No lifts, no insets — the accent colour and the
// focus ring do the work.
const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
  outline:
    'border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground',
  ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
  destructive:
    'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/40',
  link: 'text-primary underline-offset-4 hover:underline',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-9 gap-2 rounded-md px-4 text-sm',
  lg: 'h-10 gap-2 rounded-md px-6 text-sm',
  icon: 'h-9 w-9 rounded-md',
};

// Only colour + box-shadow animate, so hover fills feel instant and there's no
// layout movement. The soft 3px ring pairs with a `border-ring` shift — the
// current shadcn focus treatment — so it reads clearly on any surface.
const BASE =
  'inline-flex shrink-0 items-center justify-center font-medium no-underline transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

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
