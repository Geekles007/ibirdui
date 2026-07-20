import type { MetadataRoute } from 'next';

// Generated at build time for the static export.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://ui.ibird.dev/sitemap.xml',
  };
}
