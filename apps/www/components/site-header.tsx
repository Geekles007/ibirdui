'use client';

import { BirdMark, ExternalArrow } from '@/components/brand';
import { s } from '@/lib/style';
import Link from 'next/link';
import { useState } from 'react';

/** Primary navigation — the single source of truth for the header nav on every route. */
export const navItems: { label: string; href: string; external?: boolean }[] = [
  { label: 'Home', href: '/' },
  { label: 'Getting started', href: '/getting-started' },
  { label: 'Components', href: '/components' },
  { label: 'Tools', href: '/tools' },
  { label: 'How it works', href: '/#how' },
  { label: 'Blocks', href: 'https://blocks.ibird.dev', external: true },
];

interface SiteHeaderProps {
  /** The active nav item, matched case-insensitively against each label. */
  current: string;
  onToggleTheme: () => void;
  onOpenPalette: () => void;
}

function NavLink({
  item,
  current,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  current: string;
  onNavigate?: () => void;
}) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${item.label} (opens in a new tab)`}
        className="hov-surface"
        onClick={onNavigate}
        style={s(
          'display:inline-flex;align-items:center;gap:5px;padding:7px 11px;border-radius:7px;font-size:14px;color:var(--muted)',
        )}
      >
        {item.label}
        <ExternalArrow />
      </a>
    );
  }
  const active = item.label.toLowerCase() === current;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={active ? undefined : 'hov-surface'}
      onClick={onNavigate}
      style={s(
        `padding:7px 11px;border-radius:7px;font-size:14px;color:${active ? 'var(--foreground)' : 'var(--muted)'};${active ? 'background:var(--surface)' : ''}`,
      )}
    >
      {item.label}
    </Link>
  );
}

/**
 * The shared sticky header: brand mark, primary nav, ⌘K trigger, theme toggle and
 * GitHub link. Below 860px the inline nav collapses into a hamburger that opens a
 * dropdown. Theme and palette state are owned by the caller and passed in.
 */
export function SiteHeader({ current, onToggleTheme, onOpenPalette }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      style={s(
        'position:sticky;top:0;z-index:100;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:var(--header-bg);border-bottom:1px solid var(--border)',
      )}
    >
      <nav
        aria-label="Primary"
        style={s(
          'max-width:1280px;margin:0 auto;padding:0 24px;height:62px;display:flex;align-items:center;gap:24px',
        )}
      >
        <Link
          href="/"
          style={s(
            'display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px;letter-spacing:-.01em',
          )}
        >
          <BirdMark size={24} />
          ibirdui
        </Link>
        <div
          style={s('display:none;align-items:center;gap:4px;margin-left:8px')}
          data-nav="desktop"
        >
          {navItems.map((n) => (
            <NavLink key={n.label} item={n} current={current} />
          ))}
        </div>
        <div style={s('margin-left:auto;display:flex;align-items:center;gap:8px')}>
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            className="hov-border"
            style={s(
              'display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--muted);font-size:13px;cursor:pointer',
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <span style={s('display:none')} data-kbd="1">
              Search
            </span>
            <kbd
              style={s(
                "font-family:'Geist Mono',monospace;font-size:11px;padding:1px 5px;border-radius:5px;background:var(--surface-2);border:1px solid var(--border)",
              )}
            >
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="hov-border"
            style={s(
              'display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--foreground)',
            )}
          >
            {/* Both icons render; CSS shows the one for the active theme, so the
                markup is theme-independent and never mismatches on hydration. */}
            <svg
              className="theme-icon theme-icon--sun"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M19.2 4.8l-1.8 1.8M6.6 17.4l-1.8 1.8" />
            </svg>
            <svg
              className="theme-icon theme-icon--moon"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
            </svg>
          </button>
          <a
            href="https://github.com/Geekles007/ibirdui"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="ibirdui on GitHub"
            className="hov-border"
            style={s(
              'display:flex;align-items:center;gap:8px;padding:7px 13px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:14px;font-weight:500',
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.85.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 015 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z" />
            </svg>
            <span data-kbd="1" style={s('display:none')}>
              Star
            </span>
          </a>
          {/* Hamburger — only shown below 860px (see globals.css [data-nav]). */}
          <button
            type="button"
            data-nav="mobile-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
            className="hov-border"
            style={s(
              'align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--foreground)',
            )}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-nav"
          data-nav="mobile-menu"
          style={s(
            'display:flex;flex-direction:column;gap:2px;padding:8px 16px 16px;border-top:1px solid var(--border);background:var(--header-bg)',
          )}
        >
          {navItems.map((n) => (
            <NavLink
              key={n.label}
              item={n}
              current={current}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </div>
      )}
    </header>
  );
}
