'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const VARIANTS: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-muted text-muted-foreground',
  outline: 'border-border text-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
};

const BASE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * A small status pill / label — a styled `<span>`, decorative by default. The
 * label text *is* the meaning, so when a badge conveys status that isn't
 * obvious from its text alone (e.g. a colour-only signal), give it a
 * descriptive label rather than relying on colour:
 *
 *   <Badge>New</Badge>
 *   <Badge variant="secondary">Draft</Badge>
 *   <Badge variant="destructive" aria-label="Status: failed">Failed</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = 'default', className, ...rest },
  ref,
) {
  return <span ref={ref} className={cn(BASE, VARIANTS[variant], className)} {...rest} />;
});
