import { Switch } from '@/components/switch';
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

describe('Switch accessibility', () => {
  it('exposes role=switch with its checked state', () => {
    const { getByRole } = render(<Switch defaultChecked aria-label="Notifications" />);
    const el = getByRole('switch', { name: 'Notifications' });
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('toggles aria-checked and reports the next value (uncontrolled)', () => {
    const onCheckedChange = vi.fn();
    const { getByRole } = render(
      <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );
    const el = getByRole('switch');
    expect(el.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(el);
    expect(el.getAttribute('aria-checked')).toBe('true');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('stays put when controlled (parent owns the value)', () => {
    const onCheckedChange = vi.fn();
    const { getByRole } = render(
      <Switch checked={false} aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );
    const el = getByRole('switch');
    fireEvent.click(el);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // Controlled: still false until the parent passes a new checked prop.
    expect(el.getAttribute('aria-checked')).toBe('false');
  });

  it('does not toggle while disabled', () => {
    const onCheckedChange = vi.fn();
    const { getByRole } = render(
      <Switch disabled aria-label="Notifications" onCheckedChange={onCheckedChange} />,
    );
    getByRole('switch').click();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Switch aria-label="Notifications" />);
    await expectNoViolations(container);
  });
});
