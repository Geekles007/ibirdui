import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://ui.ibird.dev'),
  title: 'ibirdui — state-complete, accessible, upgradeable React components',
  description:
    "Registry-as-code React components. Inspired by shadcn's copy-paste ownership and built on it — adding every async state, verified accessibility, and an upgrade path that survives your edits.",
  openGraph: {
    title: 'ibirdui',
    description:
      'State-complete, accessible, upgradeable React components — distributed as registry-as-code.',
    url: 'https://ui.ibird.dev',
    siteName: 'ibirdui',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ibirdui',
    description:
      'State-complete, accessible, upgradeable React components — distributed as registry-as-code.',
  },
};

/**
 * Set the colour theme before the first paint, from localStorage or the system
 * preference, so navigations keep the chosen theme and the page never flashes.
 */
const themeScript = `(function(){try{var k='ibirdui-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Runs before hydration to avoid a theme flash — see themeScript. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: tiny, static, first-paint theme script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
