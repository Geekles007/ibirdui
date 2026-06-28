'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * A surface container and its parts. Pure layout primitives — no roles, no
 * state — so they compose into stat tiles, list items, panels and dashboard
 * cards without imposing semantics. Combine the parts as needed:
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Monthly revenue</CardTitle>
 *       <CardDescription>Updated just now</CardDescription>
 *     </CardHeader>
 *     <CardContent>$48,210</CardContent>
 *     <CardFooter>+12% vs last month</CardFooter>
 *   </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-border bg-background text-foreground shadow-sm',
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
  },
);

/**
 * The card's title. Rendered as a `<div>`, not a heading, so it never forces a
 * heading level on the surrounding document — wrap or pass your own heading
 * element when the card needs to participate in the heading outline.
 */
export const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  },
);

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
});

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
  },
);

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />;
  },
);
