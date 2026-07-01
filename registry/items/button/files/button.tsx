'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

// Filled variants get a top inset highlight ("lit from above") plus a tactile
// hover lift / active press. Quiet variants (outline/ghost/link) stay flat by
// design so the primary action keeps the visual weight.
const LIFT = 'hover:-translate-y-px active:translate-y-0';
const FILLED_SHADOW =
  'shadow-[0_1px_2px_0_rgb(0_0_0/0.28),inset_0_1px_0_0_rgb(255_255_255/0.13)] hover:shadow-[0_6px_16px_-4px_rgb(0_0_0/0.40),inset_0_1px_0_0_rgb(255_255_255/0.16)] active:shadow-[0_1px_2px_0_rgb(0_0_0/0.28)]';

const VARIANTS: Record<ButtonVariant, string> = {
  default: `bg-primary text-primary-foreground ${FILLED_SHADOW} ${LIFT}`,
  secondary: `bg-muted text-foreground shadow-sm hover:bg-muted/70 ${LIFT}`,
  outline: `border border-input bg-background text-foreground shadow-sm hover:bg-muted ${LIFT}`,
  ghost: 'text-foreground hover:bg-muted active:bg-muted/80',
  destructive: `bg-destructive text-destructive-foreground ${FILLED_SHADOW} ${LIFT}`,
  link: 'text-primary underline-offset-4 hover:underline',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-9 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-6 text-[15px]',
  icon: 'h-9 w-9 rounded-lg',
};

// transition-all so the hover shadow and active press animate, not just colour.
// The focus ring sits on an offset so it reads clearly on any surface.
const BASE =
  'inline-flex shrink-0 items-center justify-center font-medium no-underline transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none';

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
