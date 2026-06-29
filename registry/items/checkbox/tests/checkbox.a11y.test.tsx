import { Checkbox } from '@/components/checkbox';
// Resolved via the vitest aliases (see registry/vitest.config.ts).
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('Checkbox accessibility', () => {
  it('renders a native checkbox with an accessible name', () => {
    const { getByRole } = render(<Checkbox aria-label="Accept" />);
    const el = getByRole('checkbox', { name: 'Accept' }) as HTMLInputElement;
    expect(el.type).toBe('checkbox');
  });

  it('toggles checked state and fires onChange', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Checkbox aria-label="Accept" onChange={onChange} />);
    const el = getByRole('checkbox') as HTMLInputElement;
    el.click();
    expect(el.checked).toBe(true);
    expect(onChange).toHaveBeenCalled();
  });

  it('does not fire onChange while disabled', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<Checkbox aria-label="Accept" disabled onChange={onChange} />);
    getByRole('checkbox').click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('exposes the visible focus ring and forwards ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { getByRole } = render(<Checkbox ref={ref} aria-label="Accept" />);
    const el = getByRole('checkbox');
    expect(el.className).toContain('focus-visible:ring-ring');
    expect(ref.current).toBe(el);
  });

  it('has no axe violations when labelled', async () => {
    const { container } = render(
      <>
        <label htmlFor="terms">Accept the terms</label>
        <Checkbox id="terms" name="terms" />
      </>,
    );
    await expectNoViolations(container);
  });
});
