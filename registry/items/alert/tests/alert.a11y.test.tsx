import { Alert, AlertDescription, AlertTitle } from '@/components/alert';
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

describe('Alert accessibility', () => {
  it('sets no role by default (does not interrupt assistive tech)', () => {
    const { getByTestId } = render(
      <Alert data-testid="a">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something to know.</AlertDescription>
      </Alert>,
    );
    expect(getByTestId('a').getAttribute('role')).toBeNull();
  });

  it('honours an explicit role for the dynamic case', () => {
    const { getByRole } = render(
      <Alert variant="destructive" role="alert">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Your card was declined.</AlertDescription>
      </Alert>,
    );
    expect(getByRole('alert')).toBeTruthy();
  });

  it('does not impose a heading level on the document', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
      </Alert>,
    );
    expect(container.querySelectorAll('h1,h2,h3,h4,h5,h6')).toHaveLength(0);
  });

  it('forwards className and ref on the root', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { getByTestId } = render(<Alert ref={ref} className="mt-4" data-testid="a" />);
    expect(getByTestId('a').className).toContain('mt-4');
    expect(ref.current).toBe(getByTestId('a'));
  });

  it('has no axe violations in both variants', async () => {
    const { container } = render(
      <div>
        <Alert>
          <AlertTitle>Default</AlertTitle>
          <AlertDescription>Body</AlertDescription>
        </Alert>
        <Alert variant="destructive" role="alert">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Body</AlertDescription>
        </Alert>
      </div>,
    );
    await expectNoViolations(container);
  });
});
