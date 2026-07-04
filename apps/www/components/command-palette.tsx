'use client';

import { components, pages } from '@/lib/site-data';
import { s } from '@/lib/style';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface PaletteItem {
  label: string;
  hint: string;
  href?: string;
  comp?: string;
}

const SearchGlyph = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);

/**
 * The ⌘K command palette state — search index (pages + components), keyboard
 * navigation and focus handling. Both the simple pages and the docs page use
 * this one hook, so the palette can never diverge between routes.
 *
 * `onSelectComponent` lets the docs page swap the default cross-route navigation
 * (`/components#name`) for its own in-page selection.
 */
export function useCommandPalette(opts?: { onSelectComponent?: (name: string) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const onSelectComponent = opts?.onSelectComponent;

  const list = useMemo<PaletteItem[]>(() => {
    const all: PaletteItem[] = [
      ...pages.map((p) => ({ label: p.label, hint: p.hint, href: p.href })),
      ...components.map((c) => ({
        label: c.name,
        hint: `L${c.layer} · ${c.status}`,
        comp: c.name,
      })),
    ];
    const q = query.toLowerCase();
    return q
      ? all.filter((i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q))
      : all;
  }, [query]);

  const run = useCallback(
    (it: PaletteItem) => {
      setOpen(false);
      if (it.comp) {
        if (onSelectComponent) onSelectComponent(it.comp);
        else router.push(`/components#${it.comp}`);
      } else if (it.href) {
        router.push(it.href);
      }
    },
    [router, onSelectComponent],
  );

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 25);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setIndex(0);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => (i + 1 + list.length) % list.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => (i - 1 + list.length) % list.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const it = list[index];
        if (it) run(it);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, list, index, run]);

  return { open, setOpen, query, setQuery, index, setIndex, list, run, inputRef };
}

export type CommandPaletteController = ReturnType<typeof useCommandPalette>;

/** The ⌘K overlay. Driven entirely by a `useCommandPalette` controller. */
export function CommandPalette({ palette }: { palette: CommandPaletteController }) {
  const { open, setOpen, query, setQuery, index, setIndex, list, run, inputRef } = palette;
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      style={s(
        'position:fixed;inset:0;z-index:300;display:flex;align-items:flex-start;justify-content:center;padding:14vh 20px 20px;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);animation:fadeup .15s ease',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close"
        tabIndex={-1}
        style={s('position:absolute;inset:0;border:none;background:transparent;cursor:default')}
      />
      <div
        style={s(
          'position:relative;width:100%;max-width:560px;background:var(--surface);border:1px solid var(--border-strong);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7);overflow:hidden',
        )}
      >
        <div
          style={s(
            'display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid var(--border)',
          )}
        >
          <span style={s('color:var(--muted-2)')}>
            <SearchGlyph />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Jump to a component or page…"
            aria-label="Search"
            style={s(
              'flex:1;background:transparent;border:none;outline:none;color:var(--foreground);font-size:15.5px;font-family:inherit',
            )}
          />
          <kbd
            style={s(
              "font-family:'Geist Mono',monospace;font-size:11px;padding:2px 7px;border-radius:6px;background:var(--surface-2);border:1px solid var(--border);color:var(--muted-2)",
            )}
          >
            esc
          </kbd>
        </div>
        <div
          role="listbox"
          aria-label="Results"
          tabIndex={-1}
          style={s('max-height:340px;overflow-y:auto;padding:8px')}
        >
          {list.length === 0 && (
            <div style={s('padding:28px;text-align:center;color:var(--muted-2);font-size:14px')}>
              No matches.
            </div>
          )}
          {list.map((pi, i) => (
            <button
              key={`${pi.label}-${i}`}
              type="button"
              role="option"
              aria-selected={i === index}
              onClick={() => run(pi)}
              onMouseEnter={() => setIndex(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '11px 13px',
                borderRadius: '10px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                background: i === index ? 'var(--surface-2)' : 'transparent',
                border: `1px solid ${i === index ? 'var(--border-strong)' : 'transparent'}`,
              }}
            >
              <span style={s('display:flex;align-items:center;gap:11px')}>
                <span style={s('color:var(--muted-2)')}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
                <span
                  style={s("font-size:14.5px;font-weight:500;font-family:'Geist Mono',monospace")}
                >
                  {pi.label}
                </span>
              </span>
              <span
                style={s(
                  "font-size:11.5px;color:var(--muted-2);font-family:'Geist Mono',monospace",
                )}
              >
                {pi.hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
