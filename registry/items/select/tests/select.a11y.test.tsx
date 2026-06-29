import { Select } from '@/components/select';
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

function Example(props: { onChange?: () => void }) {
  return (
    <>
      <label htmlFor="role">Role</label>
      <Select id="role" name="role" defaultValue="member" {...props}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </Select>
    </>
  );
}

describe('Select accessibility', () => {
  it('renders a native select that takes a name from its label', () => {
    const { getByLabelText } = render(<Example />);
    const el = getByLabelText('Role') as HTMLSelectElement;
    expect(el.tagName).toBe('SELECT');
    expect(el.value).toBe('member');
  });

  it('hides the decorative chevron from assistive tech', () => {
    const { container } = render(<Example />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('changes value and fires onChange', () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<Example onChange={onChange} />);
    const el = getByLabelText('Role') as HTMLSelectElement;
    el.value = 'admin';
    el.dispatchEvent(new Event('change', { bubbles: true }));
    expect(el.value).toBe('admin');
    expect(onChange).toHaveBeenCalled();
  });

  it('exposes a visible focus ring on the control', () => {
    const { getByLabelText } = render(<Example />);
    expect(getByLabelText('Role').className).toContain('focus-visible:ring-ring');
  });

  it('has no axe violations when labelled', async () => {
    const { container } = render(<Example />);
    await expectNoViolations(container);
  });
});
