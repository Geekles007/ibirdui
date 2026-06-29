import { Textarea } from '@/components/textarea';
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

describe('Textarea accessibility', () => {
  it('renders a native textarea that takes a name from its label', () => {
    const { getByLabelText } = render(
      <>
        <label htmlFor="bio">Bio</label>
        <Textarea id="bio" />
      </>,
    );
    expect((getByLabelText('Bio') as HTMLTextAreaElement).tagName).toBe('TEXTAREA');
  });

  it('exposes the visible focus ring', () => {
    const { getByRole } = render(<Textarea aria-label="bio" />);
    expect(getByRole('textbox').className).toContain('focus-visible:ring-ring');
  });

  it('reflects aria-invalid visually', () => {
    const { getByRole } = render(<Textarea aria-label="bio" aria-invalid />);
    expect(getByRole('textbox').className).toContain('aria-[invalid=true]:border-destructive');
  });

  it('forwards className, props and ref', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    const { getByRole } = render(<Textarea ref={ref} aria-label="bio" rows={6} className="mt-2" />);
    const el = getByRole('textbox') as HTMLTextAreaElement;
    expect(el.rows).toBe(6);
    expect(el.className).toContain('mt-2');
    expect(ref.current).toBe(el);
  });

  it('has no axe violations when labelled', async () => {
    const { container } = render(
      <>
        <label htmlFor="bio">Bio</label>
        <Textarea id="bio" />
      </>,
    );
    await expectNoViolations(container);
  });
});
