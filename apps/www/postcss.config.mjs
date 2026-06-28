/**
 * PostCSS only runs Tailwind for the live-preview surface. The docs site itself
 * is hand-styled with inline styles + its own CSS variables and needs no build
 * step — Tailwind's `content` is scoped to the preview files and preflight is
 * off (see tailwind.config.ts), so the rest of the site is untouched.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
