import { Button, buttonClasses } from '@/components/button';
// Resolved via the vitest aliases (see registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `ibirdui add`.
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    // jsdom has no layout engine; colour-contrast can't be evaluated here.
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations).toEqual([]);
}

describe('Button accessibility', () => {
  it('renders a real <button> with an accessible name', () => {
    const { getByRole } = render(<Button>Save</Button>);
    expect(getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('defaults to type="button" so it never submits a form by surprise', () => {
    const { getByRole } = render(<Button>Save</Button>);
    expect(getByRole('button').getAttribute('type')).toBe('button');
  });

  it('exposes the visible focus ring for keyboard users', () => {
    const { getByRole } = render(<Button>Save</Button>);
    expect(getByRole('button').className).toContain('focus-visible:ring-ring');
  });

  it('does not fire onClick while disabled', () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards arbitrary button props and ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    const { getByRole } = render(
      <Button ref={ref} aria-label="Close" data-testid="x">
        ✕
      </Button>,
    );
    const el = getByRole('button', { name: 'Close' });
    expect(el.getAttribute('data-testid')).toBe('x');
    expect(ref.current).toBe(el);
  });

  it('has no axe violations across variants', async () => {
    const { container } = render(
      <div>
        <Button>Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Link</Button>
      </div>,
    );
    await expectNoViolations(container);
  });

  describe('buttonClasses', () => {
    it('composes base, variant and size, plus a passthrough className', () => {
      const cls = buttonClasses({ variant: 'outline', size: 'sm', className: 'mt-2' });
      expect(cls).toContain('border-input');
      expect(cls).toContain('h-8');
      expect(cls).toContain('mt-2');
    });
  });
});
