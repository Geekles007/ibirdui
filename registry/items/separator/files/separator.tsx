'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual + semantic orientation. Default "horizontal". */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Purely visual divider (default): hidden from assistive tech. Set to `false`
   * when the rule genuinely separates two groups of meaning — it then exposes
   * `role="separator"` with the right `aria-orientation`.
   */
  decorative?: boolean;
}

/**
 * A thin rule between content. Decorative by default — most dividers are visual
 * sugar and shouldn't add a node to the accessibility tree. When the separator
 * carries meaning (e.g. between two distinct sections of a menu or toolbar),
 * pass `decorative={false}` so screen readers announce the boundary:
 *
 *   <Separator />                                  // visual only
 *   <Separator orientation="vertical" />           // in a flex row
 *   <Separator decorative={false} />               // role="separator"
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = 'horizontal', decorative = true, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...rest}
    />
  );
});
