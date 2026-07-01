'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type AlertVariant = 'default' | 'destructive';

const VARIANTS: Record<AlertVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  destructive:
    'border-destructive/50 bg-card text-destructive [&_[data-slot=description]]:text-destructive/90',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

/**
 * A static callout box — an inline panel for a heads-up that's part of the
 * page, not a transient notification (use `toast` for those) and not an async
 * error with retry (use `error-state`).
 *
 * It deliberately sets **no** ARIA role: a callout that's simply present on the
 * page shouldn't interrupt a screen reader. When the alert appears in response
 * to an action and should be announced, add the role yourself —
 * `role="alert"` (assertive) or `role="status"` (polite):
 *
 *   <Alert variant="destructive" role="alert">
 *     <AlertTitle>Payment failed</AlertTitle>
 *     <AlertDescription>Your card was declined.</AlertDescription>
 *   </Alert>
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = 'default', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg border px-4 py-3 text-sm', VARIANTS[variant], className)}
      {...rest}
    />
  );
});

export const AlertTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function AlertTitle({ className, ...props }, ref) {
    return <div ref={ref} className={cn('mb-1 font-medium leading-none', className)} {...props} />;
  },
);

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function AlertDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      data-slot="description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
