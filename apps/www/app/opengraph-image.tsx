import { ImageResponse } from 'next/og';

// Generated at build time for the static export.
export const dynamic = 'force-static';

export const alt = 'ibirdui — state-complete, accessible, upgradeable React components';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Branded social card so shared links render a real preview, not a blank box. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0a0b0d',
        color: '#e6edf3',
        padding: '80px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div
          style={{
            display: 'flex',
            width: '46px',
            height: '46px',
            borderRadius: '13px',
            background: '#b4f22e',
          }}
        />
        <div
          style={{ display: 'flex', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          ibirdui
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <div
          style={{
            display: 'flex',
            fontSize: '64px',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: '940px',
          }}
        >
          State-complete, accessible, upgradeable React components
        </div>
        <div style={{ display: 'flex', fontSize: '30px', color: '#9aa4af' }}>
          Registry-as-code — you own the code, and it handles every async state.
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '26px',
          color: '#9aa4af',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'monospace', color: '#b4f22e' }}>
          npx ibirdui add data-table
        </div>
        <div style={{ display: 'flex' }}>ui.ibird.dev</div>
      </div>
    </div>,
    { ...size },
  );
}
