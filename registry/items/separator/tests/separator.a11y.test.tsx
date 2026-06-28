import { Separator } from '@/components/separator';
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

describe('Separator accessibility', () => {
  it('is hidden from the accessibility tree when decorative (default)', () => {
    const { container } = render(<Separator />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('none');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-orientation')).toBeNull();
  });

  it('exposes role=separator with orientation when meaningful', () => {
    const { container } = render(<Separator decorative={false} orientation="vertical" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('applies orientation-specific sizing', () => {
    const { container: h } = render(<Separator />);
    expect((h.firstElementChild as HTMLElement).className).toContain('h-px');
    cleanup();
    const { container: v } = render(<Separator orientation="vertical" />);
    expect((v.firstElementChild as HTMLElement).className).toContain('w-px');
  });

  it('forwards className and ref', () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(<Separator ref={ref} className="my-4" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('my-4');
    expect(ref.current).toBe(el);
  });

  it('has no axe violations in either mode', async () => {
    const { container } = render(
      <div>
        <Separator />
        <Separator decorative={false} />
      </div>,
    );
    await expectNoViolations(container);
  });
});
