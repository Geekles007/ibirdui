import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Getting started — ibirdui',
  description:
    'Install ibirdui components into your project: the CLI, where files land, upgrades that survive your local edits, and the MCP server for AI assistants.',
};

export default function GettingStartedLayout({ children }: { children: ReactNode }) {
  return children;
}
