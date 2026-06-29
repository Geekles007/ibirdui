import { Progress } from '@/components/progress';
// Resolved via the vitest aliases (see registry/vitest.config.ts).
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('Progress accessibility', () => {
  it('exposes role=progressbar with value attributes when determinate', () => {
    const { getByRole } = render(<Progress value={72} label="Upload" />);
    const el = getByRole('progressbar', { name: 'Upload' });
    expect(el.getAttribute('aria-valuenow')).toBe('72');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
  });

  it('clamps value into [0, max]', () => {
    const { getByRole } = render(<Progress value={150} max={100} label="x" />);
    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  });

  it('omits aria-valuenow when indeterminate', () => {
    const { getByRole } = render(<Progress label="Loading" />);
    const el = getByRole('progressbar', { name: 'Loading' });
    expect(el.getAttribute('aria-valuenow')).toBeNull();
  });

  it('respects a custom max', () => {
    const { getByRole } = render(<Progress value={3} max={5} label="Steps" />);
    const el = getByRole('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('3');
    expect(el.getAttribute('aria-valuemax')).toBe('5');
  });

  it('has no axe violations in both modes', async () => {
    const { container } = render(
      <div>
        <Progress value={40} label="Determinate" />
        <Progress label="Indeterminate" />
      </div>,
    );
    await expectNoViolations(container);
  });
});
