'use client';

import * as React from 'react';

/** Minimal className joiner so the item carries no extra dependency. */
function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. Default `min`. */
  defaultValue?: number;
  /** Minimum value. Default 0. */
  min?: number;
  /** Maximum value. Default 100. */
  max?: number;
  /** Step increment. Default 1. */
  step?: number;
  /** Fires with the next numeric value as the thumb moves. */
  onValueChange?: (value: number) => void;
}

/**
 * A single-thumb range slider. Like `radio-group`, it lets the browser do the
 * hard part: a native `<input type="range">` already exposes `role="slider"`
 * with `aria-valuenow/min/max`, full keyboard control (arrows, Home/End,
 * PageUp/PageDown) and pointer drag — for free. The themed look is just
 * `accent-primary`, the same trick `radio-group` uses.
 *
 * Works controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 * Give it a name via `aria-label` or `aria-labelledby`.
 *
 *   <Slider defaultValue={40} aria-label="Volume" />
 *   <Slider value={vol} onValueChange={setVol} max={11} aria-label="Volume" />
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { value, defaultValue, min = 0, max = 100, step = 1, onValueChange, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? min) : undefined}
      onChange={(e) => onValueChange?.(e.target.valueAsNumber)}
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...rest}
    />
  );
});
