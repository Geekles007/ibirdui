// Resolved via the vitest alias (registry/vitest.config.ts), mirroring the
// "@/lib/block-motion" path a consumer gets after `ibirdui add`.
import {
  MotionProvider,
  fade,
  layoutId,
  makeReveal,
  popInOut,
  reveal,
  revealItem,
  slideIn,
  springs,
} from '@/lib/block-motion';
import { render, screen } from '@testing-library/react';
import { MotionConfigContext } from 'framer-motion';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

describe('springs', () => {
  it('are all spring transitions', () => {
    for (const preset of Object.values(springs)) {
      expect(preset.type).toBe('spring');
    }
  });
});

describe('reveal', () => {
  it('staggers its children from the container', () => {
    expect(reveal.visible).toMatchObject({
      transition: { staggerChildren: expect.any(Number) },
    });
  });

  it('items rise and fade in, then settle at rest', () => {
    expect(revealItem.hidden).toMatchObject({ opacity: 0 });
    expect(revealItem.visible).toMatchObject({ opacity: 1, y: 0 });
  });

  it('makeReveal honours a custom tempo', () => {
    const fast = makeReveal(0.2, 0.1);
    expect(fast.visible).toMatchObject({
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    });
  });
});

describe('enter / exit variants', () => {
  it('popInOut and fade define an explicit exit', () => {
    expect(popInOut.exit).toBeDefined();
    expect(fade.exit).toBeDefined();
  });

  it('slideIn offsets along the correct axis and direction', () => {
    expect(slideIn('left').hidden).toMatchObject({ x: -24 });
    expect(slideIn('right', 40).hidden).toMatchObject({ x: 40 });
    expect(slideIn('top').hidden).toMatchObject({ y: -24 });
    expect(slideIn('bottom').hidden).toMatchObject({ y: 24 });
  });
});

describe('layoutId', () => {
  it('namespaces ids so groups never collide', () => {
    expect(layoutId('tabs', 'a')).toBe('block-motion:tabs:a');
    expect(layoutId('tabs', 'a')).not.toBe(layoutId('kanban', 'a'));
  });
});

/** Reads the reduced-motion setting Framer Motion is configured with. */
function ConfigProbe() {
  const cfg = React.useContext(MotionConfigContext);
  return <span data-testid="reduced-motion">{String(cfg.reducedMotion)}</span>;
}

describe('MotionProvider', () => {
  it('honours prefers-reduced-motion by default (accessible baseline)', () => {
    render(
      <MotionProvider>
        <ConfigProbe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('user');
  });

  it('lets a block override the reduced-motion policy', () => {
    render(
      <MotionProvider reducedMotion="always">
        <ConfigProbe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('always');
  });
});
