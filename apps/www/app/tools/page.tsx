'use client';

import { SiteChrome } from '@/components/site-chrome';
import { s } from '@/lib/style';
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

const eyebrow =
  "font-family:'Geist Mono',monospace;font-size:12.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-fg);margin-bottom:14px";

export default function ToolsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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

  /* A documented CLI command: header, blurb, command bar, optional terminal. */
  const Command = ({
    name,
    badge,
    blurb,
    cmd,
    id,
    children,
  }: {
    name: string;
    badge?: string;
    blurb: ReactNode;
    cmd: string;
    id: string;
    children?: ReactNode;
  }) => (
    <section
      id={id}
      style={s(
        'scroll-margin-top:84px;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px',
      )}
    >
      <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:8px')}>
        <h3 style={s(`font-family:${mono};font-size:17px;font-weight:600;margin:0`)}>
          ibirdui {name}
        </h3>
        {badge && (
          <span
            style={s(
              `font-family:${mono};font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--accent-fg);background:var(--accent);border:1px solid var(--border);border-radius:999px;padding:2px 8px`,
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p style={s('font-size:14.5px;line-height:1.6;color:var(--muted);margin:0 0 16px')}>
        {blurb}
      </p>
      <CommandBar cmd={cmd} id={id} />
      {children && <div style={s('margin-top:14px')}>{children}</div>}
    </section>
  );

  const mcpConfig = `{
  "mcpServers": {
    "ibirdui": {
      "command": "npx",
      "args": ["-y", "ibirdui-mcp"]
    }
  }
}`;

  return (
    <SiteChrome current="tools">
      <div style={s('max-width:880px;margin:0 auto;padding:56px 24px 100px')}>
        {/* hero */}
        <div style={s(eyebrow)}>Tooling</div>
        <h1
          style={s(
            'font-size:40px;line-height:1.05;letter-spacing:-.03em;font-weight:600;margin:0 0 14px',
          )}
        >
          The CLI &amp; the&nbsp;MCP&nbsp;server
        </h1>
        <p
          style={s(
            'font-size:18px;line-height:1.6;color:var(--muted);max-width:640px;margin:0 0 40px',
          )}
        >
          Components are only half of it. The{' '}
          <strong style={s('color:var(--foreground)')}>CLI</strong> installs them into your repo and
          keeps them current without clobbering your edits. The{' '}
          <strong style={s('color:var(--foreground)')}>MCP server</strong> hands the real source to
          your AI assistant, so it builds with actual components — not hallucinated markup.
        </p>

        {/* ── CLI ─────────────────────────────────────────────── */}
        <h2
          style={s(
            "font-family:'Geist Mono',monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);margin:0 0 18px",
          )}
        >
          Command line
        </h2>
        <div style={s('display:flex;flex-direction:column;gap:16px;margin-bottom:56px')}>
          <Command
            name="add"
            blurb={
              <>
                Copy a component and its registry dependencies into your project, and record a
                fingerprint of every file in{' '}
                <code style={s(`font-family:${mono}`)}>ibirdui.lock.json</code> — that lockfile is
                what makes safe upgrades possible.
              </>
            }
            cmd="npx ibirdui add data-table"
            id="add"
          >
            <Terminal
              title="ibirdui add"
              lines={[
                [['Registry: https://…/ibirdui', C.dim]],
                [['add ', C.green], ['components/data-table.tsx']],
                [
                  ['add ', C.green],
                  ['components/state-boundary.tsx ', C.fg],
                  ['(dependency)', C.dim],
                ],
                [['']],
                [
                  ['Done. ', C.fg],
                  ['2 file(s) written.', C.dim],
                ],
              ]}
            />
          </Command>

          <Command
            name="doctor"
            badge="new"
            blurb={
              <>
                A read-only health check. It diffs each installed file against the hash in your
                lockfile to flag the bricks you&apos;ve edited locally or that have gone missing,
                and checks the registry for newer versions. It writes nothing — it just tells you
                what <code style={s(`font-family:${mono}`)}>upgrade</code> would touch.{' '}
                <code style={s(`font-family:${mono}`)}>--offline</code> skips the network.
              </>
            }
            cmd="npx ibirdui doctor"
            id="doctor"
          >
            <Terminal
              title="ibirdui doctor"
              lines={[
                [['Registry: https://…/ibirdui', C.dim]],
                [['']],
                [
                  ['async-button', C.fg],
                  ['@1.0.0 ', C.fg],
                  ['up to date', C.dim],
                ],
                [
                  ['data-table', C.fg],
                  ['@1.0.0 ', C.fg],
                  ['update available → 1.1.0', C.cyan],
                ],
                [['  modified ', C.yellow], ['components/data-table.tsx']],
                [
                  ['confirm-dialog', C.fg],
                  ['@1.0.0 ', C.fg],
                  ['up to date', C.dim],
                ],
                [['  missing  ', C.red], ['components/confirm-dialog.tsx']],
                [['']],
                [
                  ['Summary: ', C.fg],
                  ['3 item(s) · ', C.dim],
                  ['1 modified', C.yellow],
                  [' · ', C.dim],
                  ['1 missing', C.red],
                  [' · ', C.dim],
                  ['1 update available', C.cyan],
                ],
              ]}
            />
          </Command>

          <Command
            name="upgrade"
            blurb={
              <>
                The feature copy-paste libraries don&apos;t have. For each file it compares three
                fingerprints — what you originally installed, what&apos;s on disk now, and the new
                release. Untouched files update in place; files you&apos;ve edited are kept, and the
                new version lands beside them as <code style={s(`font-family:${mono}`)}>*.new</code>{' '}
                to merge.
              </>
            }
            cmd="npx ibirdui upgrade"
            id="upgrade"
          >
            <Terminal
              title="ibirdui upgrade"
              lines={[
                [
                  ['data-table ', C.fg],
                  ['1.0.0 → 1.1.0', C.dim],
                ],
                [['  upd ', C.green], ['components/data-table.tsx']],
                [
                  ['state-boundary ', C.fg],
                  ['1.0.0 → 1.1.0', C.dim],
                ],
                [
                  ['  conflict ', C.red],
                  ['components/state-boundary.tsx ', C.fg],
                  ['→ wrote …tsx.new', C.dim],
                ],
                [['']],
                [
                  ['Done. ', C.fg],
                  ['1 updated, 1 conflict(s), 0 up to date.', C.dim],
                ],
              ]}
            />
          </Command>

          <Command
            name="gen"
            blurb="Describe what you want in plain language and ibirdui matches it against every component's AI manifest — the same intents the MCP server serves — to suggest what to add."
            cmd={'npx ibirdui gen "a user list with loading and empty states"'}
            id="gen"
          />

          <Command
            name="list"
            blurb="Print the whole catalogue: every component with its version, accessibility level and the async states it handles."
            cmd="npx ibirdui list"
            id="list"
          />
        </div>

        {/* ── MCP ─────────────────────────────────────────────── */}
        <h2
          id="mcp"
          style={s(
            "scroll-margin-top:84px;font-family:'Geist Mono',monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted-2);margin:0 0 18px",
          )}
        >
          MCP server
        </h2>
        <div
          style={s(
            'background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:18px',
          )}
        >
          <p style={s('font-size:14.5px;line-height:1.65;color:var(--muted);margin:0 0 18px')}>
            <code style={s(`font-family:${mono};color:var(--foreground)`)}>ibirdui-mcp</code>{' '}
            exposes the registry over the{' '}
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noreferrer"
              style={s('color:var(--accent-fg)')}
            >
              Model Context Protocol
            </a>
            . Add it to any MCP-aware assistant (Claude Desktop, Claude Code, Cursor…) and it can
            search components by intent and read their real source before writing a line of UI.
          </p>

          <div style={s('font-size:12.5px;color:var(--muted-2);margin:0 0 8px')}>
            Add to your MCP config
          </div>
          <div style={s('position:relative;margin-bottom:18px')}>
            <button
              type="button"
              onClick={() => copy(mcpConfig, 'mcpcfg')}
              aria-label="Copy MCP config"
              className="hov-fg"
              style={s(
                'position:absolute;top:10px;right:10px;z-index:1;color:#8b949e;background:transparent;border:none;cursor:pointer;display:inline-flex',
              )}
            >
              <CopyIcon copied={copiedId === 'mcpcfg'} />
            </button>
            <pre
              style={s(
                `margin:0;padding:16px;background:#0c0d10;border:1px solid #20232a;border-radius:12px;overflow-x:auto;font-family:${mono};font-size:12.5px;line-height:1.7;color:#e6edf3`,
              )}
            >
              {mcpConfig}
            </pre>
          </div>

          <div style={s('font-size:12.5px;color:var(--muted-2);margin:0 0 8px')}>
            …or, in Claude Code
          </div>
          <CommandBar cmd="claude mcp add ibirdui -- npx -y ibirdui-mcp" id="ccadd" />
        </div>

        {/* MCP tools */}
        <div
          style={s(
            'display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px',
          )}
          data-grid2="1"
        >
          {[
            {
              name: 'search_components',
              desc: 'Rank the catalogue against a natural-language need and return the best matches with their intents.',
            },
            {
              name: 'get_component',
              desc: 'Full details and the real source for one component — description, a11y, examples, every file it installs.',
            },
            {
              name: 'list_components',
              desc: 'The whole catalogue, optionally filtered to components that handle a given async state.',
            },
          ].map((t) => (
            <div
              key={t.name}
              style={s(
                'background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px',
              )}
            >
              <div
                style={s(
                  `font-family:${mono};font-size:13.5px;font-weight:600;color:var(--accent-fg);margin-bottom:7px`,
                )}
              >
                {t.name}
              </div>
              <p style={s('font-size:13px;line-height:1.55;color:var(--muted);margin:0')}>
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SiteChrome>
  );
}
