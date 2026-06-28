import { Input } from '@/components/input';
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

describe('Input accessibility', () => {
  it('renders a native input that takes an accessible name from a label', () => {
    const { getByLabelText } = render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" />
      </>,
    );
    const el = getByLabelText('Email') as HTMLInputElement;
    expect(el.tagName).toBe('INPUT');
    expect(el.type).toBe('email');
  });

  it('defaults type to "text"', () => {
    const { getByRole } = render(<Input aria-label="name" />);
    expect((getByRole('textbox') as HTMLInputElement).type).toBe('text');
  });

  it('exposes the visible focus ring', () => {
    const { getByRole } = render(<Input aria-label="name" />);
    expect(getByRole('textbox').className).toContain('focus-visible:ring-ring');
  });

  it('reflects aria-invalid visually rather than by colour of another element', () => {
    const { getByRole } = render(<Input aria-label="name" aria-invalid />);
    const el = getByRole('textbox');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.className).toContain('aria-[invalid=true]:border-destructive');
  });

  it('forwards className, props and ref', () => {
    const ref = { current: null as HTMLInputElement | null };
    const { getByRole } = render(
      <Input ref={ref} aria-label="name" className="mt-2" placeholder="Type…" />,
    );
    const el = getByRole('textbox') as HTMLInputElement;
    expect(el.className).toContain('mt-2');
    expect(el.placeholder).toBe('Type…');
    expect(ref.current).toBe(el);
  });

  it('has no axe violations when labelled', async () => {
    const { container } = render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" />
      </>,
    );
    await expectNoViolations(container);
  });
});
