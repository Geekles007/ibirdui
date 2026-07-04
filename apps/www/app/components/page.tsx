'use client';

import { CommandPalette, useCommandPalette } from '@/components/command-palette';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { useTheme } from '@/components/use-theme';
import { previews } from '@/lib/previews';
import { type Comp, components, docs, firstComponent, layerNames } from '@/lib/site-data';
import { s } from '@/lib/style';
import Link from 'next/link';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

type DemoState = 'loading' | 'empty' | 'error' | 'success';
type AsVariant = 'idle' | 'loading' | 'empty' | 'error' | 'success';

const badge = (color: string, bg: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 11px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 600,
  fontFamily: "'Geist Mono', monospace",
  color,
  background: bg,
});

const statusMeta = {
  done: { label: 'Shipped', style: badge('var(--primary-foreground)', 'var(--primary)') },
  next: { label: 'Next', style: badge('#fff', 'var(--warning)') },
  planned: { label: 'Planned', style: badge('var(--muted)', 'var(--surface-2)') },
} as const;

const pill = (a: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 13px',
  borderRadius: '999px',
  fontSize: '12.5px',
  fontWeight: a ? 600 : 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  border: `1px solid ${a ? 'var(--primary)' : 'var(--border)'}`,
  background: a ? 'var(--primary-dim)' : 'transparent',
  color: a ? 'var(--accent-fg)' : 'var(--muted)',
  transition: 'all .15s ease',
});

const SearchSvg = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);
const CheckSvg = ({ size = 16, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2.4"
    aria-hidden="true"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const CopySvg = ({ size = 14, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
);
const ShieldSvg = ({ size = 11 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    aria-hidden="true"
  >
    <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
const ReplaySvg = ({ size = 13 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export default function ComponentsPage() {
  const reducedRef = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { isLight, toggle: toggleTheme } = useTheme();
  const [selected, setSelected] = useState('async-state');
  const [sideQuery, setSideQuery] = useState('');
  const [demoState, setDemoState] = useState<DemoState>('success');
  const [caseIdx, setCaseIdx] = useState(0);
  // Bumped by the Replay button to remount the live demo (resets its state and
  // replays the entrance animation).
  const [replayNonce, setReplayNonce] = useState(0);
  const [asVariant, setAsVariant] = useState<AsVariant>('success');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [liveMsg, setLiveMsg] = useState('Loaded 4 users.');

  const select = useCallback((name: string) => {
    const meta = components.find((c) => c.name === name);
    setSelected(name);
    setCaseIdx(0);
    setReplayNonce(0);
    setAnnounce(`Viewing ${name} documentation`);
    if (meta && meta.status === 'done') {
      setDemoState('success');
      setLiveMsg('Loaded 4 users.');
    }
    try {
      history.replaceState(null, '', `#${name}`);
    } catch {}
    try {
      window.scrollTo({ top: 0, behavior: reducedRef.current ? 'auto' : 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  // The ⌘K palette selects a component in-page rather than navigating away.
  const palette = useCommandPalette({ onSelectComponent: select });

  // mount: reduced-motion + hash + hash listener
  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hash = (location.hash || '').replace('#', '');
    if (hash && components.some((c) => c.name === hash)) setSelected(hash);

    const onHash = () => {
      const h = (location.hash || '').replace('#', '');
      if (h && components.some((c) => c.name === h)) select(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [select]);

  const copy = useCallback((text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {}
    setCopiedId(id);
    setAnnounce('Copied to clipboard');
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 1600);
  }, []);

  const setDemo = useCallback((st: DemoState) => {
    const map: Record<DemoState, string> = {
      loading: 'Loading users…',
      empty: 'No users found.',
      error: 'Could not load users. Retry is available.',
      success: 'Loaded 4 users.',
    };
    setDemoState(st);
    setLiveMsg(map[st]);
    setAnnounce(map[st]);
  }, []);

  const demoRetry = useCallback(() => {
    setDemo('loading');
    clearTimeout(demoTimer.current);
    demoTimer.current = setTimeout(() => setDemo('success'), 850);
  }, [setDemo]);

  // ---- derived: sidebar ----
  const q = sideQuery.toLowerCase();
  const sideGroups = [...new Set(components.map((c) => c.layer))]
    .sort((a, b) => a - b)
    .map((L) => ({
      layer: L,
      name: layerNames[L],
      items: components.filter((c) => c.layer === L && (!q || c.name.toLowerCase().includes(q))),
    }))
    .filter((g) => g.items.length > 0);

  // ---- derived: selected doc ----
  const meta = components.find((c) => c.name === selected) ?? firstComponent;
  const d = docs[meta.name] || ({} as (typeof docs)[string]);
  const planned = meta.status !== 'done';
  const install = `npx ibirdui add ${meta.name}`;
  const exAsyncState = !planned && d.example === 'asyncstate';
  const exInteractive = !planned && d.example === 'interactive';
  // Live, interactive use-case previews that mount the real component.
  const cases = !planned ? previews[meta.name] : undefined;
  const activeCase = cases?.[Math.min(caseIdx, cases.length - 1)];
  const hasTutorial = !planned && !!d.tutorial;
  const hasProps = !planned && !!d.props;
  const hasA11y = !planned && meta.a11y && !!d.a11yList;

  // async-state inspector
  const asShapes: Record<AsVariant, string> = {
    idle: '{\n  status: "idle"\n}',
    loading: '{\n  status: "loading"\n}',
    empty: '{\n  status: "empty"\n}',
    error:
      '{\n  status: "error",\n  error: Error("Network request failed"),\n  retry: () => void\n}',
    success:
      '{\n  status: "success",\n  data: [\n    { id: "u1", name: "Ada Lovelace" },\n    { id: "u2", name: "Grace Hopper" },\n    … 2 more\n  ]\n}',
  };
  const asNotes: Record<AsVariant, string> = {
    idle: 'The resting state. A component renders nothing or a prompt — no spinner, because nothing was requested.',
    loading:
      'A request is in flight. Components show a skeleton and set aria-busy so assistive tech knows to wait.',
    empty:
      'Success with zero results — deliberately distinct from loading, so users see a real "nothing here" message.',
    error:
      'Note the retry callback travels inside the variant. The error UI can wire a button without extra plumbing.',
    success:
      'The only variant carrying data. TypeScript narrows it here, so data is guaranteed to exist.',
  };
  const asKeys: AsVariant[] = ['idle', 'loading', 'empty', 'error', 'success'];

  // interactive demo
  const dlLabels: Record<DemoState, string> = {
    loading: 'Loading',
    empty: 'Empty',
    error: 'Error',
    success: 'Success',
  };
  const demoStatesArr: DemoState[] = ['loading', 'empty', 'error', 'success'];
  const demoUsers = [
    { id: 'u1', name: 'Ada Lovelace', role: 'Maintainer', initials: 'AL' },
    { id: 'u2', name: 'Grace Hopper', role: 'Admin', initials: 'GH' },
    { id: 'u3', name: 'Alan Turing', role: 'Member', initials: 'AT' },
    { id: 'u4', name: 'Radia Perlman', role: 'Member', initials: 'RP' },
  ];

  // prev/next
  const idx = components.findIndex((c) => c.name === meta.name);
  const prev: Comp | undefined = components[idx - 1];
  const next: Comp | undefined = components[idx + 1];

  const monoMuted2 = "font-family:'Geist Mono',monospace;font-size:11.5px;color:#6b727c";
  const codeCard = 'background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow:hidden';
  const preStyle =
    "padding:16px;overflow-x:auto;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:1.7;color:#e6edf3;white-space:pre";

  return (
    <div
      style={s(
        'min-height:100vh;width:100%;background:var(--background);color:var(--foreground);position:relative',
      )}
    >
      <a
        href="#doc-main"
        style={s(
          'position:absolute;left:12px;top:-60px;z-index:200;background:var(--primary);color:var(--primary-foreground);padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px',
        )}
      >
        Skip to content
      </a>
      <div
        aria-live="polite"
        role="status"
        style={s(
          'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0',
        )}
      >
        {announce}
      </div>

      <SiteHeader
        current="components"
        isLight={isLight}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => palette.setOpen(true)}
      />

      {/* DOCS LAYOUT */}
      <div style={s('max-width:1280px;margin:0 auto;padding:0 24px')}>
        <div
          data-docgrid="1"
          style={s('display:grid;grid-template-columns:248px 1fr;gap:40px;align-items:start')}
        >
          {/* SIDEBAR */}
          <aside
            data-sidebar="1"
            aria-label="Component navigation"
            style={s(
              'position:sticky;top:62px;max-height:calc(100vh - 62px);overflow-y:auto;padding:28px 18px 28px 0;border-right:1px solid var(--border)',
            )}
          >
            <div style={s('position:relative;margin-bottom:18px')}>
              <span
                aria-hidden="true"
                style={s(
                  'position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted-2)',
                )}
              >
                <SearchSvg />
              </span>
              <input
                type="text"
                value={sideQuery}
                onChange={(e) => setSideQuery(e.target.value)}
                placeholder="Filter components…"
                aria-label="Filter components"
                className="foc-border"
                style={s(
                  'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:9px 11px 9px 33px;color:var(--foreground);font-size:13.5px;outline:none;font-family:inherit',
                )}
              />
            </div>
            <nav
              aria-label="Components by layer"
              style={s('display:flex;flex-direction:column;gap:18px')}
            >
              {sideGroups.map((g) => (
                <div key={g.layer}>
                  <div
                    style={s(
                      "font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);padding:0 8px 8px",
                    )}
                  >
                    L{g.layer} · {g.name}
                  </div>
                  <div style={s('display:flex;flex-direction:column;gap:1px')}>
                    {g.items.map((c) => {
                      const active = c.name === selected;
                      const dotColor =
                        c.status === 'done'
                          ? 'var(--primary)'
                          : c.status === 'next'
                            ? 'var(--warning)'
                            : 'var(--border-strong)';
                      return (
                        <button
                          key={c.name}
                          type="button"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => select(c.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            width: '100%',
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Geist Mono', monospace",
                            fontSize: '13px',
                            background: active ? 'var(--surface)' : 'transparent',
                            color: active ? 'var(--foreground)' : 'var(--muted)',
                            transition: 'background .12s',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              flex: 'none',
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: dotColor,
                              boxShadow: active ? '0 0 0 3px var(--primary-dim)' : 'none',
                            }}
                          />
                          <span
                            style={s(
                              'flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
                            )}
                          >
                            {c.name}
                          </span>
                          {c.status === 'done' && (
                            <span
                              aria-label="shipped"
                              style={s(
                                "font-size:9.5px;font-family:'Geist Mono',monospace;color:var(--accent-fg)",
                              )}
                            >
                              ●
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* MAIN DOC */}
          <main id="doc-main" style={s('padding:36px 0 80px;min-width:0')}>
            <div
              style={s(
                "display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted-2);font-family:'Geist Mono',monospace;margin-bottom:18px",
              )}
            >
              <Link href="/components" className="hov-fg" style={s('color:var(--muted-2)')}>
                components
              </Link>
              <span aria-hidden="true">/</span>
              <span style={s('color:var(--accent-fg)')}>L{meta.layer}</span>
              <span aria-hidden="true">/</span>
              <span style={s('color:var(--foreground)')}>{meta.name}</span>
            </div>

            <div
              style={s(
                'display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:14px',
              )}
            >
              <div>
                <h1
                  style={s(
                    "font-size:38px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0 0 12px;font-family:'Geist Mono',monospace",
                  )}
                >
                  {meta.name}
                </h1>
                <div style={s('display:flex;flex-wrap:wrap;gap:8px;align-items:center')}>
                  <span style={statusMeta[meta.status].style}>{statusMeta[meta.status].label}</span>
                  <span
                    style={s(
                      "font-size:11px;font-family:'Geist Mono',monospace;padding:3px 9px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--muted)",
                    )}
                  >
                    {meta.kind}
                  </span>
                  {meta.a11y && (
                    <span
                      style={s(
                        "font-size:11px;font-family:'Geist Mono',monospace;padding:3px 9px;border-radius:999px;background:var(--primary-dim);color:var(--accent-fg);display:inline-flex;align-items:center;gap:5px",
                      )}
                    >
                      <ShieldSvg />
                      a11y AA · axe verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p
              style={s(
                'font-size:18px;line-height:1.6;color:var(--muted);max-width:680px;margin:0 0 24px',
              )}
            >
              {d.intro}
            </p>

            <button
              type="button"
              onClick={() => copy(install, 'install')}
              aria-label="Copy install command"
              className="hov-accent"
              style={s(
                'display:flex;align-items:center;gap:12px;background:#0c0d10;border:1px solid #20232a;border-radius:11px;padding:13px 16px;cursor:pointer;margin-bottom:38px;max-width:420px;width:100%',
              )}
            >
              <span style={s("color:#6b727c;font-family:'Geist Mono',monospace;font-size:14px")}>
                $
              </span>
              <code
                style={s(
                  "flex:1;text-align:left;font-family:'Geist Mono',monospace;font-size:13.5px;color:#e6edf3",
                )}
              >
                {install}
              </code>
              <span style={s('flex:none;color:var(--accent-fg);display:inline-flex')}>
                {copiedId === 'install' ? <CheckSvg /> : <CopySvg stroke="#8b949e" size={15} />}
              </span>
            </button>

            {/* LIVE EXAMPLE */}
            <section aria-labelledby="ex-h" style={s('margin-bottom:44px')}>
              <h2
                id="ex-h"
                style={s(
                  "font-size:13px;font-family:'Geist Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--accent-fg);margin:0 0 16px",
                )}
              >
                Live example
              </h2>

              {!exAsyncState && !exInteractive && (
                <div
                  style={s(
                    `border:1px ${planned ? 'dashed var(--border-strong)' : 'solid var(--border)'};border-radius:14px;padding:${planned ? '40px 24px' : '20px'};text-align:${planned ? 'center' : 'left'};background:var(--surface)`,
                  )}
                >
                  {planned && (
                    <>
                      <div
                        style={s(
                          "display:inline-flex;align-items:center;gap:8px;font-family:'Geist Mono',monospace;font-size:12.5px;color:var(--warning);margin-bottom:14px;padding:5px 12px;border-radius:999px;border:1px solid var(--warning)",
                        )}
                      >
                        <span
                          style={s(
                            'width:6px;height:6px;border-radius:50%;background:var(--warning)',
                          )}
                        />
                        {statusMeta[meta.status].label} · Layer {meta.layer}
                      </div>
                      <p
                        style={s(
                          'font-size:15px;color:var(--muted);margin:0 auto 18px;max-width:440px',
                        )}
                      >
                        This component isn&apos;t shipped yet. Here&apos;s the intended API it will
                        expose once it lands.
                      </p>
                    </>
                  )}
                  <div
                    style={s(
                      `text-align:left;${planned ? 'max-width:560px;margin:0 auto;' : ''}background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow:hidden`,
                    )}
                  >
                    <div
                      style={s(`padding:10px 14px;border-bottom:1px solid #1c1f25;${monoMuted2}`)}
                    >
                      {d.apiFile || `${meta.name}.tsx`}
                    </div>
                    <pre style={s(preStyle)}>{d.api || '// coming soon'}</pre>
                  </div>
                </div>
              )}

              {exAsyncState && (
                <div
                  style={s(
                    'background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px',
                  )}
                >
                  <div
                    role="group"
                    aria-label="Inspect AsyncState variant"
                    style={s('display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px')}
                  >
                    {asKeys.map((k) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={asVariant === k}
                        onClick={() => setAsVariant(k)}
                        style={pill(asVariant === k)}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <div style={s(codeCard)}>
                    <div
                      style={s(`padding:9px 14px;border-bottom:1px solid #1c1f25;${monoMuted2}`)}
                    >
                      state: AsyncState&lt;User[]&gt;
                    </div>
                    <pre
                      style={s(
                        "padding:16px;font-family:'Geist Mono',monospace;font-size:13px;line-height:1.75;color:#e6edf3;white-space:pre;overflow-x:auto",
                      )}
                    >
                      {asShapes[asVariant]}
                    </pre>
                  </div>
                  <p
                    style={s('font-size:13.5px;color:var(--muted);margin:14px 0 0;line-height:1.6')}
                  >
                    {asNotes[asVariant]}
                  </p>
                </div>
              )}

              {exInteractive && (
                <div data-exrow="1" style={s('display:grid;grid-template-columns:1fr;gap:14px')}>
                  <div
                    style={s(
                      'background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden',
                    )}
                  >
                    <div
                      style={s(
                        'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:14px 18px;border-bottom:1px solid var(--border)',
                      )}
                    >
                      <div
                        style={s(
                          "font-family:'Geist Mono',monospace;font-size:13px;color:var(--muted)",
                        )}
                      >
                        {d.exampleTag}
                      </div>
                      <div
                        role="group"
                        aria-label="Switch state"
                        style={s('display:flex;gap:6px;flex-wrap:wrap')}
                      >
                        {demoStatesArr.map((k) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={demoState === k}
                            onClick={() => setDemo(k)}
                            style={pill(demoState === k)}
                          >
                            {dlLabels[k]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={s('padding:16px;min-height:256px')}>
                      {demoState === 'loading' && (
                        <div
                          aria-busy="true"
                          aria-label="Loading"
                          style={s('display:flex;flex-direction:column;gap:10px')}
                        >
                          {[1, 2, 3, 4].map((sk) => (
                            <div
                              key={sk}
                              style={s(
                                'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;border:1px solid var(--border)',
                              )}
                            >
                              <div
                                style={s(
                                  'width:34px;height:34px;border-radius:9px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border-strong) 37%,var(--surface-2) 63%);background-size:200% 100%;animation:shimmer 1.4s linear infinite',
                                )}
                              />
                              <div style={s('flex:1;display:flex;flex-direction:column;gap:7px')}>
                                <div
                                  style={s(
                                    'height:11px;width:42%;border-radius:5px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border-strong) 37%,var(--surface-2) 63%);background-size:200% 100%;animation:shimmer 1.4s linear infinite',
                                  )}
                                />
                                <div
                                  style={s(
                                    'height:9px;width:26%;border-radius:5px;background:linear-gradient(90deg,var(--surface-2) 25%,var(--border-strong) 37%,var(--surface-2) 63%);background-size:200% 100%;animation:shimmer 1.4s linear infinite',
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {demoState === 'empty' && (
                        <div
                          style={s(
                            'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:224px;color:var(--muted)',
                          )}
                        >
                          <svg
                            width="34"
                            height="34"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            style={s('margin-bottom:12px;opacity:.55')}
                            aria-hidden="true"
                          >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4-4" />
                          </svg>
                          <div
                            style={s(
                              'font-size:15px;font-weight:500;color:var(--foreground);margin-bottom:5px',
                            )}
                          >
                            No users found
                          </div>
                          <div style={s('font-size:13.5px')}>Invite a teammate to get started.</div>
                        </div>
                      )}
                      {demoState === 'error' && (
                        <div
                          style={s(
                            'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:224px',
                          )}
                        >
                          <div style={s('color:var(--destructive);margin-bottom:12px')}>
                            <svg
                              width="34"
                              height="34"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 8v4.5M12 16h.01" />
                            </svg>
                          </div>
                          <div style={s('font-size:15px;font-weight:500;margin-bottom:5px')}>
                            Couldn&apos;t load users
                          </div>
                          <div style={s('font-size:13.5px;color:var(--muted);margin-bottom:16px')}>
                            A network error occurred.
                          </div>
                          <button
                            type="button"
                            onClick={demoRetry}
                            className="hov-dim"
                            style={s(
                              'display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:9px;background:var(--foreground);color:var(--background);font-size:13.5px;font-weight:600;cursor:pointer',
                            )}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              aria-hidden="true"
                            >
                              <path d="M21 12a9 9 0 11-2.6-6.4M21 4v5h-5" />
                            </svg>
                            Retry
                          </button>
                        </div>
                      )}
                      {demoState === 'success' && (
                        <div>
                          <div
                            style={s(
                              "font-size:12px;color:var(--muted-2);font-family:'Geist Mono',monospace;padding:0 4px 9px",
                            )}
                          >
                            4 users
                          </div>
                          <div style={s('display:flex;flex-direction:column;gap:7px')}>
                            {demoUsers.map((u) => (
                              <div
                                key={u.id}
                                style={s(
                                  'display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;border:1px solid var(--border);background:var(--surface-2);animation:fadeup .35s ease both',
                                )}
                              >
                                <span
                                  style={s(
                                    "width:34px;height:34px;border-radius:9px;background:var(--primary-dim);color:var(--accent-fg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;font-family:'Geist Mono',monospace",
                                  )}
                                >
                                  {u.initials}
                                </span>
                                <div style={s('flex:1;min-width:0')}>
                                  <div style={s('font-size:14px;font-weight:500')}>{u.name}</div>
                                  <div style={s('font-size:12px;color:var(--muted-2)')}>
                                    {u.role}
                                  </div>
                                </div>
                                <span
                                  aria-hidden="true"
                                  style={s(
                                    'width:7px;height:7px;border-radius:50%;background:var(--primary)',
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={s(
                      "display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted-2);font-family:'Geist Mono',monospace;padding:2px 4px",
                    )}
                  >
                    <span style={s('color:var(--accent-fg)')}>aria-live</span> announced: &quot;
                    {liveMsg}&quot;
                  </div>
                </div>
              )}
            </section>

            {/* USE CASES — live, interactive previews of the real component */}
            {activeCase && cases && (
              <section aria-labelledby="uc-h" style={s('margin-bottom:44px')}>
                <h2
                  id="uc-h"
                  style={s(
                    "font-size:13px;font-family:'Geist Mono',monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--accent-fg);margin:0 0 16px",
                  )}
                >
                  Use cases · try it
                </h2>

                <div
                  role="group"
                  aria-label="Choose a use case"
                  style={s('display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px')}
                >
                  {cases.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={caseIdx === i}
                      onClick={() => setCaseIdx(i)}
                      style={pill(caseIdx === i)}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>

                <p style={s('font-size:14px;color:var(--muted);margin:0 0 16px;line-height:1.6')}>
                  {activeCase.blurb}
                </p>

                {/* Live demo — mounts the real component on a playground stage.
                    Everything inside .ibird-preview speaks the shadcn channel
                    tokens (hsl(var(--…))), so it must NOT use the docs colour
                    variables. The demo remounts (and re-animates) on a new use
                    case or on Replay via its key. */}
                <div className="ibird-preview" style={s('margin-bottom:14px')}>
                  <div className="ibird-stage">
                    <button
                      type="button"
                      className="ibird-replay"
                      onClick={() => setReplayNonce((n) => n + 1)}
                      aria-label="Replay this demo"
                    >
                      <ReplaySvg />
                      Replay
                    </button>
                    <div
                      key={`${meta.name}-${activeCase.id}-${replayNonce}`}
                      className="ibird-demo"
                    >
                      <activeCase.Demo />
                    </div>
                  </div>
                </div>

                {/* Source for this use case */}
                <div
                  style={s(
                    'position:relative;background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow:hidden',
                  )}
                >
                  <div
                    style={s(
                      'display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #1c1f25',
                    )}
                  >
                    <span style={s(monoMuted2)}>{meta.name}.tsx</span>
                    <button
                      type="button"
                      onClick={() => copy(activeCase.code, `case-${meta.name}-${activeCase.id}`)}
                      aria-label="Copy code"
                      className="hov-fg"
                      style={s(
                        'color:#8b949e;background:transparent;border:none;cursor:pointer;display:inline-flex',
                      )}
                    >
                      {copiedId === `case-${meta.name}-${activeCase.id}` ? (
                        <CheckSvg size={15} stroke="#b6ff2e" />
                      ) : (
                        <CopySvg />
                      )}
                    </button>
                  </div>
                  <pre style={s(preStyle)}>{activeCase.code}</pre>
                </div>
              </section>
            )}

            {/* TUTORIAL */}
            {hasTutorial && (
              <section aria-labelledby="tut-h" style={s('margin-bottom:44px')}>
                <h2
                  id="tut-h"
                  style={s('font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px')}
                >
                  Tutorial
                </h2>
                <p style={s('font-size:15px;color:var(--muted);margin:0 0 26px')}>
                  {d.tutorialIntro}
                </p>
                <ol
                  style={s(
                    'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0',
                  )}
                >
                  {(d.tutorial || []).map((st, i, arr) => {
                    const id = `st-${meta.name}-${i}`;
                    return (
                      <li
                        key={id}
                        style={s(
                          'display:grid;grid-template-columns:34px 1fr;gap:16px;padding-bottom:26px;position:relative',
                        )}
                      >
                        <div style={s('display:flex;flex-direction:column;align-items:center')}>
                          <span
                            aria-hidden="true"
                            style={s(
                              "flex:none;width:30px;height:30px;border-radius:50%;background:var(--primary-dim);color:var(--accent-fg);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;font-family:'Geist Mono',monospace",
                            )}
                          >
                            {i + 1}
                          </span>
                          {i < arr.length - 1 && (
                            <span
                              aria-hidden="true"
                              style={s('flex:1;width:1px;background:var(--border);margin-top:6px')}
                            />
                          )}
                        </div>
                        <div style={s('min-width:0;padding-top:3px')}>
                          <h3 style={s('font-size:16px;font-weight:600;margin:0 0 6px')}>
                            {st.title}
                          </h3>
                          <p
                            style={s(
                              'font-size:14px;line-height:1.6;color:var(--muted);margin:0 0 14px',
                            )}
                          >
                            {st.body}
                          </p>
                          {st.code && (
                            <div
                              style={s(
                                'position:relative;background:#0c0d10;border:1px solid #20232a;border-radius:11px;overflow:hidden',
                              )}
                            >
                              <div
                                style={s(
                                  'display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-bottom:1px solid #1c1f25',
                                )}
                              >
                                <span style={s(monoMuted2)}>{st.file}</span>
                                <button
                                  type="button"
                                  onClick={() => copy(st.code, id)}
                                  aria-label="Copy code"
                                  className="hov-fg"
                                  style={s(
                                    'color:#8b949e;background:transparent;border:none;cursor:pointer;display:inline-flex',
                                  )}
                                >
                                  {copiedId === id ? (
                                    <CheckSvg size={15} stroke="#b6ff2e" />
                                  ) : (
                                    <CopySvg />
                                  )}
                                </button>
                              </div>
                              <pre
                                style={s(
                                  "padding:15px;overflow-x:auto;font-family:'Geist Mono',monospace;font-size:12.5px;line-height:1.7;color:#e6edf3;white-space:pre",
                                )}
                              >
                                {st.code}
                              </pre>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* API / PROPS */}
            {hasProps && (
              <section aria-labelledby="props-h" style={s('margin-bottom:44px')}>
                <h2
                  id="props-h"
                  style={s('font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px')}
                >
                  {d.propsTitle}
                </h2>
                <p style={s('font-size:15px;color:var(--muted);margin:0 0 20px')}>{d.propsIntro}</p>
                <div style={s('border:1px solid var(--border);border-radius:14px;overflow:hidden')}>
                  <div
                    data-propsrow="1"
                    style={s(
                      "display:grid;grid-template-columns:200px 220px 1fr;gap:18px;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border);font-size:12px;font-family:'Geist Mono',monospace;color:var(--muted-2);text-transform:uppercase;letter-spacing:.05em",
                    )}
                  >
                    <span>{d.col0}</span>
                    <span>Type</span>
                    <span>Description</span>
                  </div>
                  {(d.props || []).map((p) => (
                    <div
                      key={p.name}
                      data-propsrow="1"
                      style={s(
                        'display:grid;grid-template-columns:200px 220px 1fr;gap:18px;padding:15px 20px;border-bottom:1px solid var(--border);align-items:start',
                      )}
                    >
                      <code
                        style={s(
                          "font-family:'Geist Mono',monospace;font-size:13px;color:var(--foreground);font-weight:500",
                        )}
                      >
                        {p.name}
                      </code>
                      <code
                        style={s(
                          "font-family:'Geist Mono',monospace;font-size:12.5px;color:var(--accent-fg);word-break:break-word",
                        )}
                      >
                        {p.type}
                      </code>
                      <span style={s('font-size:13.5px;color:var(--muted);line-height:1.5')}>
                        {p.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCESSIBILITY */}
            {hasA11y && (
              <section aria-labelledby="a11y-h" style={s('margin-bottom:44px')}>
                <h2
                  id="a11y-h"
                  style={s(
                    'display:flex;align-items:center;gap:10px;font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 6px',
                  )}
                >
                  <span style={s('color:var(--accent-fg)')}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  Accessibility
                </h2>
                <p style={s('font-size:15px;color:var(--muted);margin:0 0 20px')}>
                  Guaranteed and{' '}
                  <strong style={s('color:var(--foreground);font-weight:600')}>
                    verified by an axe-core test
                  </strong>{' '}
                  that fails the build on regression — not just documented.
                </p>
                <div
                  data-grid2="1"
                  style={s('display:grid;grid-template-columns:1fr 1fr;gap:12px')}
                >
                  {(d.a11yList || []).map((ag) => (
                    <div
                      key={ag}
                      style={s(
                        'display:flex;gap:11px;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px',
                      )}
                    >
                      <span style={s('color:var(--accent-fg);flex:none;margin-top:1px')}>
                        <CheckSvg size={16} />
                      </span>
                      <span style={s('font-size:13.5px;line-height:1.55;color:var(--muted)')}>
                        {ag}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* prev / next */}
            <nav
              aria-label="Component pagination"
              style={s('display:flex;gap:14px;border-top:1px solid var(--border);padding-top:24px')}
            >
              {prev && (
                <button
                  type="button"
                  onClick={() => select(prev.name)}
                  className="hov-border"
                  style={s(
                    'flex:1;display:flex;flex-direction:column;gap:4px;text-align:left;padding:15px 18px;border-radius:12px;border:1px solid var(--border);background:var(--surface);cursor:pointer',
                  )}
                >
                  <span
                    style={s(
                      "font-size:11.5px;color:var(--muted-2);font-family:'Geist Mono',monospace",
                    )}
                  >
                    ← Previous
                  </span>
                  <span
                    style={s("font-size:14.5px;font-weight:500;font-family:'Geist Mono',monospace")}
                  >
                    {prev.name}
                  </span>
                </button>
              )}
              {next && (
                <button
                  type="button"
                  onClick={() => select(next.name)}
                  className="hov-border"
                  style={s(
                    'flex:1;display:flex;flex-direction:column;gap:4px;text-align:right;align-items:flex-end;padding:15px 18px;border-radius:12px;border:1px solid var(--border);background:var(--surface);cursor:pointer',
                  )}
                >
                  <span
                    style={s(
                      "font-size:11.5px;color:var(--muted-2);font-family:'Geist Mono',monospace",
                    )}
                  >
                    Next →
                  </span>
                  <span
                    style={s("font-size:14.5px;font-weight:500;font-family:'Geist Mono',monospace")}
                  >
                    {next.name}
                  </span>
                </button>
              )}
            </nav>
          </main>
        </div>
      </div>

      {/* FOOTER */}
      <SiteFooter />

      <CommandPalette palette={palette} />
    </div>
  );
}
