import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/card';
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

function Example() {
  return (
    <Card data-testid="card">
      <CardHeader>
        <CardTitle>Monthly revenue</CardTitle>
        <CardDescription>Updated just now</CardDescription>
      </CardHeader>
      <CardContent>$48,210</CardContent>
      <CardFooter>+12% vs last month</CardFooter>
    </Card>
  );
}

describe('Card accessibility', () => {
  it('renders a plain container with no imposed role', () => {
    const { getByTestId } = render(<Example />);
    const card = getByTestId('card');
    expect(card.getAttribute('role')).toBeNull();
  });

  it('does not add a heading to the document outline (title is a div)', () => {
    const { container } = render(<Example />);
    expect(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).toHaveLength(0);
  });

  it('forwards className and ref on the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { getByTestId } = render(
      <Card ref={ref} className="w-80" data-testid="card">
        body
      </Card>,
    );
    const el = getByTestId('card');
    expect(el.className).toContain('w-80');
    expect(ref.current).toBe(el);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoViolations(container);
  });
});
