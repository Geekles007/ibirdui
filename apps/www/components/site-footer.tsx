import { BirdMark } from '@/components/brand';
import { s } from '@/lib/style';
import Link from 'next/link';

/** The shared site footer — same brand mark, license line and links on every route. */
export function SiteFooter() {
  return (
    <footer style={s('border-top:1px solid var(--border);background:var(--background)')}>
      <div
        style={s(
          'max-width:1280px;margin:0 auto;padding:34px 24px;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between',
        )}
      >
        <div style={s('display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px')}>
          <BirdMark size={22} />
          ibirdui
        </div>
        <div style={s("font-size:12.5px;color:var(--muted-2);font-family:'Geist Mono',monospace")}>
          MIT · © Geekles007
        </div>
        <div style={s('display:flex;gap:18px;font-size:13.5px')}>
          <a
            href="https://github.com/Geekles007/ibirdui"
            target="_blank"
            rel="noreferrer noopener"
            className="hov-fg"
            style={s('color:var(--muted)')}
          >
            GitHub
          </a>
          <Link href="/getting-started" className="hov-fg" style={s('color:var(--muted)')}>
            Getting started
          </Link>
          <Link href="/components" className="hov-fg" style={s('color:var(--muted)')}>
            Components
          </Link>
        </div>
      </div>
    </footer>
  );
}
