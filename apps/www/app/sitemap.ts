import type { MetadataRoute } from 'next';

// Generated at build time for the static export.
export const dynamic = 'force-static';

const BASE = 'https://ui.ibird.dev';

/** The site's routes (trailing slashes match `trailingSlash: true` in next.config). */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/getting-started/', '/components/', '/tools/'];
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }));
}
