'use client';

import { SiteChrome } from '@/components/site-chrome';
import { s } from '@/lib/style';
import Link from 'next/link';
import { type ReactNode, useCallback, useRef, useState } from 'react';

const mono = "'Geist Mono',monospace";

/* A line in a faux-terminal: an array of [text, color?] spans. */
type Span = [string, string?];
type Line = Span[];

const C = {
  dim: '#6b727c',
  fg: '#e6edf3',
  green: '#7ee787',
  yellow: '#e3b341',
  red: '#ff7b72',
  cyan: '#79c0ff',
  purple: '#d2a8ff',
} as const;

type Pkg = 'npm' | 'pnpm' | 'bun';
/* How each package manager runs a published bin. */
const runner: Record<Pkg, string> = { npm: 'npx', pnpm: 'pnpm dlx', bun: 'bunx' };

const eyebrow =
  "font-family:'Geist Mono',monospace;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-fg);margin-bottom:14px";

const h2 =
  "scroll-margin-top:84px;font-family:'Geist Mono',monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);margin:0 0 18px";

const seg = (active: boolean): string =>
  `padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-family:${mono};font-size:13px;font-weight:500;background:${active ? 'var(--surface-2)' : 'transparent'};color:${active ? 'var(--foreground)' : 'var(--muted-2)'}`;

function CopyIcon({ copied }: { copied: boolean }) {
  return copied ? (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#b6ff2e"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ) : (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/* One row of the framework → target-directory table. */
interface LayoutRow {
  setup: string;
  detected: string;
  lands: string;
  flag?: string;
}
const layoutRows: LayoutRow[] = [
  {
    setup: 'TanStack Start',
    detected: 'tsconfig alias → ./src/*',
    lands: 'src/components/…',
  },
  {
    setup: 'Next.js (with src/)',
    detected: 'src/ directory present',
    lands: 'src/components/…',
  },
  {
    setup: 'Next.js (app at root)',
    detected: 'no src/ → repo root',
    lands: 'components/…',
  },
  {
    setup: 'Vite + React (src/)',
    detected: 'src/ directory present',
    lands: 'src/components/…',
  },
  {
    setup: 'Remix / React Router',
    detected: 'no src/ → repo root',
    lands: 'app/components/…',
    flag: '--dir app',
  },
  {
    setup: 'Plain React',
    detected: 'no src/ → repo root',
    lands: 'components/…',
  },
];

export default function GettingStartedPage() {
  const [pkg, setPkg] = useState<Pkg>('npm');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const run = runner[pkg];

  const copy = useCallback((text: string, id: string) => {
    if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(text);
    setCopiedId(id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedId(null), 1600);
  }, []);

  /* A copyable command bar (one shell line). */
  const CommandBar = ({ cmd, id }: { cmd: string; id: string }) => (
    <div
      style={s(
        'display:flex;align-items:center;gap:12px;background:#0c0d10;border:1px solid #20232a;border-radius:11px;padding:13px 15px',
      )}
    >
      <span aria-hidden="true" style={s(`color:#6b727c;font-family:${mono};font-size:13.5px`)}>
        $
      </span>
      <code
        style={s(
          `flex:1;font-family:${mono};font-size:13.5px;color:#e6edf3;overflow-x:auto;white-space:nowrap`,
        )}
      >
        {cmd}
      </code>
      <button
        type="button"
        onClick={() => copy(cmd, id)}
        aria-label={`Copy: ${cmd}`}
        className="hov-fg"
        style={s(
          'flex:none;color:#8b949e;background:transparent;border:none;cursor:pointer;display:inline-flex',
        )}
      >
        <CopyIcon copied={copiedId === id} />
      </button>
    </div>
  );

  /* A faux-terminal output panel (read-only, syntax-tinted). */
  const Terminal = ({ title, lines }: { title: string; lines: Line[] }) => (
    <div
      style={s('background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow:hidden')}
    >
      <div
        style={s(
          'display:flex;align-items:center;gap:7px;padding:10px 14px;border-bottom:1px solid #1c1f25',
        )}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <span style={s(`margin-left:8px;font-family:${mono};font-size:11.5px;color:#6b727c`)}>
          {title}
        </span>
      </div>
      <pre
        style={s(
          `margin:0;padding:14px 16px;overflow-x:auto;font-family:${mono};font-size:12.5px;line-height:1.75`,
        )}
      >
        <code>
          {lines.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
            <span key={i}>
              {line.map((span, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
                <span key={j} style={{ color: span[1] ?? C.fg }}>
                  {span[0]}
                </span>
              ))}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );

  /* A numbered step card: index, title, blurb, and its content. */
  const Step = ({
    n,
    title,
    blurb,
    children,
  }: {
    n: number;
    title: string;
    blurb: ReactNode;
    children: ReactNode;
  }) => (
    <div style={s('display:flex;gap:16px')}>
      <div
        aria-hidden="true"
        style={s(
          `flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:${mono};font-size:13px;font-weight:600;color:var(--accent-fg);background:var(--accent);border:1px solid var(--border)`,
        )}
      >
        {n}
      </div>
      <div style={s('flex:1;min-width:0')}>
        <h3 style={s('font-size:16.5px;font-weight:600;margin:0 0 6px')}>{title}</h3>
        <p style={s('font-size:14.5px;line-height:1.6;color:var(--muted);margin:0 0 14px')}>
          {blurb}
        </p>
        {children}
      </div>
    </div>
  );

  /* A soft callout for a tip or gotcha. */
  const Callout = ({ children }: { children: ReactNode }) => (
    <div
      style={s(
        'display:flex;gap:11px;padding:14px 16px;border-radius:12px;background:var(--accent);border:1px solid var(--border)',
      )}
    >
      <span aria-hidden="true" style={s('flex:none;color:var(--accent-fg);margin-top:1px')}>
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
      </span>
      <p style={s('font-size:13.5px;line-height:1.6;color:var(--muted);margin:0')}>{children}</p>
    </div>
  );

  const Code = ({ children }: { children: ReactNode }) => (
    <code
      style={s(
        `font-family:${mono};font-size:.92em;background:var(--surface-2);border:1px solid var(--border);border-radius:5px;padding:1px 5px`,
      )}
    >
      {children}
    </code>
  );

  return (
    <SiteChrome current="getting started">
      <div style={s('max-width:880px;margin:0 auto;padding:56px 24px 100px')}>
        {/* hero */}
        <div style={s(eyebrow)}>Getting started</div>
        <h1
          style={s(
            'font-size:42px;line-height:1.04;letter-spacing:-.03em;font-weight:600;margin:0 0 16px',
          )}
        >
          Up and running in five&nbsp;minutes.
        </h1>
        <p
          style={s(
            'font-size:18px;line-height:1.6;color:var(--muted);max-width:660px;margin:0 0 22px',
          )}
        >
          ibirdui isn&apos;t a dependency — the CLI copies real, owned source into your repo. This
          guide takes you from an empty project to your first accessible component, and explains
          exactly <strong style={s('color:var(--foreground)')}>where</strong> files land in your
          framework and how to keep them current.
        </p>

        {/* package-manager toggle */}
        <div style={s('display:flex;align-items:center;gap:12px;margin-bottom:44px')}>
          <span style={s('font-size:13px;color:var(--muted-2)')}>Package manager</span>
          <div
            role="tablist"
            aria-label="Package manager"
            style={s(
              'display:inline-flex;gap:4px;padding:4px;border-radius:11px;background:var(--surface);border:1px solid var(--border)',
            )}
          >
            {(['npm', 'pnpm', 'bun'] as Pkg[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={pkg === p}
                onClick={() => setPkg(p)}
                style={s(seg(pkg === p))}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* on this page */}
        <nav
          aria-label="On this page"
          style={s('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:52px;padding-bottom:8px')}
        >
          {[
            ['Prerequisites', '#prerequisites'],
            ['Install & setup', '#install'],
            ['Your first component', '#first'],
            ['Where files go', '#layout'],
            ['The lockfile', '#lockfile'],
            ['Stay up to date', '#update'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="hov-border"
              style={s(
                `font-size:12.5px;font-family:${mono};color:var(--muted);padding:6px 11px;border-radius:999px;border:1px solid var(--border);background:var(--surface)`,
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ── PREREQUISITES ──────────────────────────────── */}
        <section id="prerequisites" style={s('scroll-margin-top:84px;margin-bottom:56px')}>
          <h2 style={s(h2)}>Prerequisites</h2>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 18px')}>
            ibirdui components are React + TypeScript, styled with Tailwind CSS against a small set
            of semantic design tokens. You need:
          </p>
          <ul
            style={s(
              'list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px',
            )}
          >
            {[
              {
                k: 'react',
                body: (
                  <>
                    A <strong style={s('color:var(--foreground)')}>React 18+</strong> project
                    (Next.js, TanStack Start, Vite, Remix — anything that renders React).
                  </>
                ),
              },
              {
                k: 'ts',
                body: (
                  <>
                    <strong style={s('color:var(--foreground)')}>TypeScript</strong> — every
                    component ships as <Code>.tsx</Code> with full types.
                  </>
                ),
              },
              {
                k: 'tailwind',
                body: (
                  <>
                    <strong style={s('color:var(--foreground)')}>Tailwind CSS</strong> — the{' '}
                    <Code>theme</Code> item wires up the design tokens (added for you automatically
                    the first time you need it).
                  </>
                ),
              },
              {
                k: 'node',
                body: (
                  <>
                    <strong style={s('color:var(--foreground)')}>Node 18+</strong> so you can run
                    the CLI with <Code>{run}</Code>.
                  </>
                ),
              },
            ].map((item) => (
              <li
                key={item.k}
                style={s(
                  'display:flex;gap:11px;font-size:14.5px;line-height:1.55;color:var(--muted)',
                )}
              >
                <span
                  aria-hidden="true"
                  style={s('flex:none;color:var(--accent-fg);margin-top:2px')}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── INSTALL ────────────────────────────────────── */}
        <section id="install" style={s('scroll-margin-top:84px;margin-bottom:56px')}>
          <h2 style={s(h2)}>Install &amp; setup</h2>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 26px')}>
            There is nothing to <Code>npm install</Code> for ibirdui itself — you invoke the CLI on
            demand. Start by laying down the design tokens, then add your first component.
          </p>
          <div style={s('display:flex;flex-direction:column;gap:30px')}>
            <Step
              n={1}
              title="Add the theme"
              blurb={
                <>
                  The <Code>theme</Code> item copies the token stylesheet and a Tailwind preset into
                  your project. Every other component assumes these tokens exist, so add it first.
                </>
              }
            >
              <div style={s('display:flex;flex-direction:column;gap:12px')}>
                <CommandBar cmd={`${run} ibirdui add theme`} id="add-theme" />
                <Terminal
                  title="ibirdui add theme"
                  lines={[
                    [['Registry: https://ui.ibird.dev', C.dim]],
                    [['add ', C.green], ['styles/theme.css']],
                    [['add ', C.green], ['tailwind.preset.ts']],
                    [['']],
                    [
                      ['Done. ', C.fg],
                      ['2 file(s) written.', C.dim],
                    ],
                  ]}
                />
              </div>
            </Step>

            <Step
              n={2}
              title="Wire up Tailwind & import the tokens"
              blurb={
                <>
                  Register the preset so utilities like <Code>bg-background</Code> and{' '}
                  <Code>text-muted-foreground</Code> resolve, and import the stylesheet once in your
                  global CSS.
                </>
              }
            >
              <Terminal
                title="tailwind.config.ts + globals.css"
                lines={[
                  [['// tailwind.config.ts', C.dim]],
                  [
                    ['import', C.red],
                    [' ibirdui ', C.fg],
                    ['from', C.red],
                    [' "./tailwind.preset"', C.cyan],
                  ],
                  [
                    ['export default', C.red],
                    [' { ', C.fg],
                    ['presets', C.cyan],
                    [': [ibirdui] }', C.fg],
                  ],
                  [['']],
                  [['/* app/globals.css */', C.dim]],
                  [
                    ['@import', C.red],
                    [' "../styles/theme.css"', C.cyan],
                    [';', C.fg],
                  ],
                ]}
              />
            </Step>
          </div>
        </section>

        {/* ── FIRST COMPONENT ────────────────────────────── */}
        <section id="first" style={s('scroll-margin-top:84px;margin-bottom:56px')}>
          <h2 style={s(h2)}>Your first component</h2>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 26px')}>
            <Code>add</Code> pulls a component and everything it depends on. Ask for{' '}
            <Code>data-list</Code> and the CLI also brings in <Code>state-boundary</Code> and the{' '}
            <Code>async-state</Code> contract — then records a fingerprint of every file so upgrades
            stay safe.
          </p>
          <div style={s('display:flex;flex-direction:column;gap:12px')}>
            <CommandBar cmd={`${run} ibirdui add data-list`} id="add-list" />
            <Terminal
              title="ibirdui add data-list"
              lines={[
                [['Registry: https://ui.ibird.dev', C.dim]],
                [
                  ['Installing into src/', C.purple],
                  [' (detected)', C.dim],
                ],
                [
                  ['add ', C.green],
                  ['src/lib/async-state.ts ', C.fg],
                  ['(dependency)', C.dim],
                ],
                [
                  ['add ', C.green],
                  ['src/components/state-boundary.tsx ', C.fg],
                  ['(dependency)', C.dim],
                ],
                [['add ', C.green], ['src/components/data-list.tsx']],
                [['']],
                [
                  ['Done. ', C.fg],
                  ['3 file(s) written.', C.dim],
                ],
              ]}
            />
          </div>
          <div style={s('margin-top:16px')}>
            <Callout>
              Notice the <Code>Installing into src/ (detected)</Code> line. That&apos;s the CLI
              matching your project layout — covered next.
            </Callout>
          </div>
        </section>

        {/* ── WHERE FILES GO — the core section ──────────── */}
        <section id="layout" style={s('scroll-margin-top:84px;margin-bottom:56px')}>
          <h2 style={s(h2)}>Where files go</h2>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 18px')}>
            A component like <Code>button</Code> is written to a path such as{' '}
            <Code>components/button.tsx</Code>. Whether that sits at your repo root or under{' '}
            <Code>src/</Code> depends on how your framework is laid out — so the CLI detects it
            instead of guessing from the framework&apos;s name.
          </p>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 24px')}>
            On the <strong style={s('color:var(--foreground)')}>first</strong> <Code>add</Code>, the
            base directory is resolved once and pinned in your lockfile, in this order:
          </p>

          {/* resolution order */}
          <ol
            style={s(
              'list-style:none;counter-reset:step;padding:0;margin:0 0 30px;display:flex;flex-direction:column;gap:12px',
            )}
          >
            {[
              {
                k: 'flag',
                body: (
                  <>
                    An explicit <Code>--dir</Code> flag, if you pass one — always wins.
                  </>
                ),
              },
              {
                k: 'tsconfig',
                body: (
                  <>
                    A <Code>tsconfig.json</Code> path alias or <Code>baseUrl</Code> pointing into{' '}
                    <Code>src/</Code> (e.g. <Code>&quot;~/*&quot;: [&quot;./src/*&quot;]</Code>) →{' '}
                    <Code>src</Code>.
                  </>
                ),
              },
              {
                k: 'srcdir',
                body: (
                  <>
                    An existing top-level <Code>src/</Code> directory → <Code>src</Code>.
                  </>
                ),
              },
              {
                k: 'root',
                body: (
                  <>
                    Otherwise, the repo root (<Code>.</Code>).
                  </>
                ),
              },
            ].map((item, i) => (
              <li key={item.k} style={s('display:flex;gap:13px;align-items:flex-start')}>
                <span
                  aria-hidden="true"
                  style={s(
                    `flex:none;width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:${mono};font-size:12px;font-weight:600;color:var(--muted-2);background:var(--surface-2);border:1px solid var(--border)`,
                  )}
                >
                  {i + 1}
                </span>
                <span
                  style={s('font-size:14.5px;line-height:1.55;color:var(--muted);padding-top:2px')}
                >
                  {item.body}
                </span>
              </li>
            ))}
          </ol>

          {/* framework table */}
          <div
            style={s(
              'border:1px solid var(--border);border-radius:14px;overflow:hidden;overflow-x:auto',
            )}
          >
            <table
              style={s('width:100%;border-collapse:collapse;font-size:13.5px;min-width:560px')}
            >
              <thead>
                <tr style={s('background:var(--surface)')}>
                  {['Your setup', 'How it resolves', 'Files land in'].map((th) => (
                    <th
                      key={th}
                      style={s(
                        `text-align:left;padding:12px 16px;font-family:${mono};font-size:11.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted-2);font-weight:500;border-bottom:1px solid var(--border)`,
                      )}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {layoutRows.map((row) => (
                  <tr key={row.setup} style={s('border-bottom:1px solid var(--border)')}>
                    <td style={s('padding:13px 16px;font-weight:500;color:var(--foreground)')}>
                      {row.setup}
                    </td>
                    <td style={s('padding:13px 16px;color:var(--muted)')}>
                      {row.detected}
                      {row.flag && (
                        <>
                          {' '}
                          <span
                            style={s(
                              `font-family:${mono};font-size:11.5px;color:var(--accent-fg);background:var(--accent);border:1px solid var(--border);border-radius:6px;padding:1px 6px;white-space:nowrap`,
                            )}
                          >
                            {row.flag}
                          </span>
                        </>
                      )}
                    </td>
                    <td
                      style={s(
                        `padding:13px 16px;font-family:${mono};font-size:12.5px;color:var(--accent-fg)`,
                      )}
                    >
                      {row.lands}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={s('margin-top:24px;display:flex;flex-direction:column;gap:16px')}>
            <div>
              <h3 style={s('font-size:16px;font-weight:600;margin:0 0 8px')}>
                Overriding the target with <Code>--dir</Code>
              </h3>
              <p style={s('font-size:14.5px;line-height:1.6;color:var(--muted);margin:0 0 12px')}>
                Any layout the detector doesn&apos;t cover — Remix&apos;s <Code>app/</Code>, a
                monorepo package, a custom folder — is one flag away. It&apos;s remembered in the
                lockfile, so you only pass it once.
              </p>
              <CommandBar cmd={`${run} ibirdui add button --dir app`} id="add-dir" />
            </div>

            <Callout>
              The chosen directory is saved as <Code>baseDir</Code> in{' '}
              <Code>ibirdui.lock.json</Code>. Every later <Code>add</Code>, <Code>upgrade</Code> and{' '}
              <Code>doctor</Code> reads it, so your components never end up split between two
              folders — even across machines.
            </Callout>
          </div>
        </section>

        {/* ── LOCKFILE ───────────────────────────────────── */}
        <section id="lockfile" style={s('scroll-margin-top:84px;margin-bottom:56px')}>
          <h2 style={s(h2)}>The lockfile</h2>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 22px')}>
            <Code>add</Code> writes an <Code>ibirdui.lock.json</Code> at your project root. It
            records the registry, the base directory, and — per component — the version and a hash
            of every file it wrote. That fingerprint is what makes{' '}
            <Link href="/tools#upgrade" style={s('color:var(--accent-fg)')}>
              safe upgrades
            </Link>{' '}
            possible: the CLI can tell an untouched file from one you&apos;ve edited. Commit it.
          </p>
          <Terminal
            title="ibirdui.lock.json"
            lines={[
              [['{', C.fg]],
              [
                ['  "registry"', C.cyan],
                [': ', C.fg],
                ['"https://ui.ibird.dev"', C.green],
                [',', C.fg],
              ],
              [
                ['  "baseDir"', C.cyan],
                [': ', C.fg],
                ['"src"', C.green],
                [',', C.fg],
                ['        // ← where files go', C.dim],
              ],
              [
                ['  "items"', C.cyan],
                [': {', C.fg],
              ],
              [
                ['    "data-list"', C.cyan],
                [': {', C.fg],
              ],
              [
                ['      "version"', C.cyan],
                [': ', C.fg],
                ['"1.0.0"', C.green],
                [',', C.fg],
              ],
              [
                ['      "files"', C.cyan],
                [': { ', C.fg],
                ['"components/data-list.tsx"', C.cyan],
                [': ', C.fg],
                ['"a1b2c3…"', C.green],
                [' }', C.fg],
              ],
              [['    }', C.fg]],
              [['  }', C.fg]],
              [['}', C.fg]],
            ]}
          />
          <div style={s('margin-top:16px')}>
            <Callout>
              File keys stay relative to the registry (<Code>components/data-list.tsx</Code>) — the{' '}
              <Code>baseDir</Code> is applied on top. That keeps the lockfile portable: the same
              file works whether a teammate is on a <Code>src/</Code> layout or not.
            </Callout>
          </div>
        </section>

        {/* ── STAY UP TO DATE ────────────────────────────── */}
        <section id="update" style={s('scroll-margin-top:84px;margin-bottom:48px')}>
          <h2 style={s(h2)}>Stay up to date</h2>
          <p style={s('font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 22px')}>
            Because you own the source, updates are opt-in. <Code>doctor</Code> shows what has
            drifted or has a newer version; <Code>upgrade</Code> pulls new releases and preserves
            your local edits, dropping a <Code>.new</Code> file beside anything that conflicts.
          </p>
          <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:12px')} data-grid2="1">
            <div style={s('display:flex;flex-direction:column;gap:8px')}>
              <CommandBar cmd={`${run} ibirdui doctor`} id="doctor" />
              <p style={s('font-size:13px;line-height:1.5;color:var(--muted-2);margin:0 4px')}>
                Read-only health check — writes nothing.
              </p>
            </div>
            <div style={s('display:flex;flex-direction:column;gap:8px')}>
              <CommandBar cmd={`${run} ibirdui upgrade`} id="upgrade" />
              <p style={s('font-size:13px;line-height:1.5;color:var(--muted-2);margin:0 4px')}>
                3-way merge — your edits are kept.
              </p>
            </div>
          </div>
          <p style={s('font-size:14px;line-height:1.6;color:var(--muted);margin:20px 0 0')}>
            Both live in the{' '}
            <Link href="/tools" style={s('color:var(--accent-fg)')}>
              CLI reference
            </Link>
            , alongside the <Code>gen</Code> and <Code>list</Code> commands and the MCP server.
          </p>
        </section>

        {/* next steps */}
        <div
          style={s(
            'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:8px',
          )}
          data-grid2="1"
        >
          {[
            {
              href: '/components',
              title: 'Browse components',
              desc: 'Every primitive with live examples, props and a11y notes.',
              external: false,
            },
            {
              href: '/tools',
              title: 'CLI & MCP reference',
              desc: 'Full command surface and the AI-assistant integration.',
              external: false,
            },
            {
              href: 'https://blocks.ibird.dev',
              title: 'Blocks',
              desc: 'Designed, animated compositions built on these primitives.',
              external: true,
            },
          ].map((card) =>
            card.external ? (
              <a
                key={card.href}
                href={card.href}
                target="_blank"
                rel="noreferrer noopener"
                className="hov-border"
                style={s(
                  'display:flex;flex-direction:column;gap:6px;padding:18px;border-radius:14px;border:1px solid var(--border);background:var(--surface)',
                )}
              >
                <div style={s('font-size:15px;font-weight:600')}>{card.title} ↗</div>
                <p style={s('font-size:13px;line-height:1.5;color:var(--muted);margin:0')}>
                  {card.desc}
                </p>
              </a>
            ) : (
              <Link
                key={card.href}
                href={card.href}
                className="hov-border"
                style={s(
                  'display:flex;flex-direction:column;gap:6px;padding:18px;border-radius:14px;border:1px solid var(--border);background:var(--surface)',
                )}
              >
                <div style={s('font-size:15px;font-weight:600')}>{card.title}</div>
                <p style={s('font-size:13px;line-height:1.5;color:var(--muted);margin:0')}>
                  {card.desc}
                </p>
              </Link>
            ),
          )}
        </div>
      </div>
    </SiteChrome>
  );
}
