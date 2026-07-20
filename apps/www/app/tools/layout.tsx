import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Tools — ibirdui',
  description:
    'The ibirdui CLI (add · upgrade · doctor · gen · list) and the MCP server that hands AI assistants the real source of your components — no hallucinated markup.',
};

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return children;
}
