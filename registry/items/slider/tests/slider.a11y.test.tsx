import { Slider } from '@/components/slider';
// Resolved via the vitest aliases (see registry/vitest.config.ts).
import { cleanup, fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('Slider accessibility', () => {
  it('exposes role=slider with its value range', () => {
    const { getByRole } = render(
      <Slider defaultValue={40} min={0} max={100} aria-label="Volume" />,
    );
    const el = getByRole('slider', { name: 'Volume' }) as HTMLInputElement;
    expect(el.getAttribute('aria-valuemin') ?? el.min).toBe('0');
    expect(el.getAttribute('aria-valuemax') ?? el.max).toBe('100');
    expect(el.value).toBe('40');
  });

  it('reports the next value as the thumb moves (uncontrolled)', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <Slider defaultValue={40} aria-label="Volume" onValueChange={onValueChange} />,
    );
    const el = getByRole('slider') as HTMLInputElement;
    fireEvent.change(el, { target: { value: '55' } });
    expect(onValueChange).toHaveBeenCalledWith(55);
  });

  it('stays put when controlled (parent owns the value)', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <Slider value={30} aria-label="Volume" onValueChange={onValueChange} />,
    );
    const el = getByRole('slider') as HTMLInputElement;
    fireEvent.change(el, { target: { value: '70' } });
    expect(onValueChange).toHaveBeenCalledWith(70);
    // Controlled: still 30 until the parent passes a new value prop.
    expect(el.value).toBe('30');
  });

  it('does not fire while disabled', () => {
    const onValueChange = vi.fn();
    const { getByRole } = render(
      <Slider defaultValue={40} disabled aria-label="Volume" onValueChange={onValueChange} />,
    );
    const el = getByRole('slider') as HTMLInputElement;
    expect(el.disabled).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Slider defaultValue={40} aria-label="Volume" />);
    await expectNoViolations(container);
  });
});
