import { Badge } from '@/components/badge';
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

describe('Badge accessibility', () => {
  it('renders its text inline so the label is read in place', () => {
    const { getByText } = render(<Badge>New</Badge>);
    expect(getByText('New').tagName).toBe('SPAN');
  });

  it('keeps an explicit aria-label for colour-only status', () => {
    const { getByLabelText } = render(
      <Badge variant="destructive" aria-label="Status: failed">
        Failed
      </Badge>,
    );
    expect(getByLabelText('Status: failed')).toBeTruthy();
  });

  it('forwards className and ref', () => {
    const ref = { current: null as HTMLSpanElement | null };
    const { getByText } = render(
      <Badge ref={ref} className="ml-2">
        Beta
      </Badge>,
    );
    expect(getByText('Beta').className).toContain('ml-2');
    expect(ref.current).toBe(getByText('Beta'));
  });

  it('has no axe violations across variants', async () => {
    const { container } = render(
      <div>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>,
    );
    await expectNoViolations(container);
  });
});
