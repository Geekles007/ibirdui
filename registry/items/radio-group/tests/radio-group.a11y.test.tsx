import { Radio, RadioGroup } from '@/components/radio-group';
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

function Group(props: { value?: string; onValueChange?: (v: string) => void }) {
  return (
    <RadioGroup aria-label="Plan" {...props}>
      <label htmlFor="free">
        Free <Radio id="free" value="free" />
      </label>
      <label htmlFor="pro">
        Pro <Radio id="pro" value="pro" />
      </label>
    </RadioGroup>
  );
}

describe('RadioGroup accessibility', () => {
  it('exposes role=radiogroup with an accessible name', () => {
    const { getByRole } = render(<Group />);
    expect(getByRole('radiogroup', { name: 'Plan' })).toBeTruthy();
  });

  it('shares one name across options and reflects the controlled value', () => {
    const { getByLabelText } = render(<Group value="pro" />);
    const free = getByLabelText('Free') as HTMLInputElement;
    const pro = getByLabelText('Pro') as HTMLInputElement;
    expect(free.name).toBe(pro.name);
    expect(pro.checked).toBe(true);
    expect(free.checked).toBe(false);
  });

  it('reports the selected value on change', () => {
    const onValueChange = vi.fn();
    const { getByLabelText } = render(<Group onValueChange={onValueChange} />);
    (getByLabelText('Pro') as HTMLInputElement).click();
    expect(onValueChange).toHaveBeenCalledWith('pro');
  });

  it('throws if a Radio is used outside a RadioGroup', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Radio value="x" />)).toThrow(/inside a <RadioGroup>/);
    spy.mockRestore();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Group value="free" />);
    await expectNoViolations(container);
  });
});
