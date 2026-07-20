import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Components — ibirdui',
  description:
    'Browse the ibirdui registry: state-complete, accessible React components with live examples, async-state guarantees, and copy-paste install commands.',
};

export default function ComponentsLayout({ children }: { children: ReactNode }) {
  return children;
}
