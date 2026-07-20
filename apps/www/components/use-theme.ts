'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'ibirdui-theme';

/**
 * Owns the site colour theme and mirrors it onto `<html data-theme>`, persisting
 * the choice to localStorage so it survives navigations — the site is a static
 * export of separate pages, so without this the toggle reset on every click-through.
 *
 * The initial value is read from the attribute the pre-hydration script in
 * `layout.tsx` already set (from localStorage or the system preference), so the
 * page never flashes the wrong theme.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
      ? 'light'
      : 'dark',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode, etc.) — the attribute still applies.
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, isLight: theme === 'light', setTheme, toggle };
}
