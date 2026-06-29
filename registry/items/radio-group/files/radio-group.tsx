'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

interface RadioGroupContext {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
}
const Ctx = React.createContext<RadioGroupContext | null>(null);

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Shared input name. Auto-generated if omitted. */
  name?: string;
  /** Controlled selected value. */
  value?: string;
  /** Fires with the newly selected value. */
  onValueChange?: (value: string) => void;
}

/**
 * Groups a set of `Radio`s so the browser does the hard part: native radios
 * sharing one `name` get arrow-key navigation and single-selection for free.
 * The group is a `role="radiogroup"` — give it a label via `aria-label` or
 * `aria-labelledby`.
 *
 *   <RadioGroup value={plan} onValueChange={setPlan} aria-label="Plan">
 *     <label><Radio value="free" /> Free</label>
 *     <label><Radio value="pro" /> Pro</label>
 *   </RadioGroup>
 */
export function RadioGroup({
  name,
  value,
  onValueChange,
  className,
  children,
  ...rest
}: RadioGroupProps) {
  const auto = React.useId();
  const ctx = React.useMemo<RadioGroupContext>(
    () => ({ name: name ?? auto, value, onValueChange }),
    [name, auto, value, onValueChange],
  );
  return (
    <Ctx.Provider value={ctx}>
      <div role="radiogroup" className={cn('flex flex-col gap-2', className)} {...rest}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'value'> {
  /** This option's value. */
  value: string;
}

/**
 * One option in a `RadioGroup` — a native `<input type="radio">` with the
 * themed look. Reads its name and selection from the group context, so you
 * only pass `value`. Pair each with a label (a wrapping `<label>` or `field`).
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { value, className, ...rest },
  ref,
) {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('<Radio> must be used inside a <RadioGroup>');
  return (
    <input
      ref={ref}
      type="radio"
      name={ctx.name}
      value={value}
      checked={ctx.value !== undefined ? ctx.value === value : undefined}
      onChange={(e) => {
        if (e.target.checked) ctx.onValueChange?.(value);
      }}
      className={cn(
        'h-4 w-4 shrink-0 cursor-pointer border border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...rest}
    />
  );
});
