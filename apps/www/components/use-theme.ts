'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

/**
 * Owns the site colour theme and mirrors it onto <html data-theme>. Every page
 * shares this hook so the toggle behaves identically everywhere.
 */
export function useTheme(initial: Theme = 'dark') {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, isLight: theme === 'light', setTheme, toggle };
}
