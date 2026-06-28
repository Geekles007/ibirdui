import type { Config } from 'tailwindcss';
// The registry ships the same Tailwind preset a real consumer would use, so the
// preview renders components exactly as they look in a user's app.
import preset from '../../registry/items/theme/files/tailwind.preset';

export default {
  presets: [preset],
  // Scope scanning to the live-preview surface only: the synced real component
  // sources and the use-case demos. The rest of the docs site uses inline
  // styles + its own CSS variables, so Tailwind must not touch it.
  content: ['./registry-preview/**/*.{ts,tsx}', './lib/previews.tsx', './app/components/page.tsx'],
  // The docs site is fully hand-styled. Disable Tailwind's global reset so it
  // can never alter the surrounding chrome — previews rely on explicit
  // utilities, not preflight.
  corePlugins: { preflight: false },
} satisfies Config;
