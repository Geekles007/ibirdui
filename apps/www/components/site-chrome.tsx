'use client';

import { CommandPalette, useCommandPalette } from '@/components/command-palette';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { useTheme } from '@/components/use-theme';
import { s } from '@/lib/style';
import type { ReactNode } from 'react';

/**
 * Shared page shell for the simple (non-docs) routes: header, footer, ⌘K palette
 * and theme toggle. The docs page composes the same header/footer/palette pieces
 * directly because it needs to interleave its own sidebar layout.
 */
export function SiteChrome({ current, children }: { current: string; children: ReactNode }) {
  const { isLight, toggle } = useTheme();
  const palette = useCommandPalette();

  return (
    <div
      style={s(
        'min-height:100vh;width:100%;background:var(--background);color:var(--foreground);position:relative',
      )}
    >
      <a
        href="#main"
        style={s(
          'position:absolute;left:12px;top:-60px;z-index:200;background:var(--primary);color:var(--primary-foreground);padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px',
        )}
      >
        Skip to content
      </a>

      <SiteHeader
        current={current}
        isLight={isLight}
        onToggleTheme={toggle}
        onOpenPalette={() => palette.setOpen(true)}
      />

      <main id="main">{children}</main>

      <SiteFooter />

      <CommandPalette palette={palette} />
    </div>
  );
}
