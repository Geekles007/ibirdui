import { createHash } from 'node:crypto';

/**
 * Stable content fingerprint for a registry file. Stored in the consumer's
 * `ibirdui.lock.json` so `ibirdui upgrade` can tell an untouched file (safe to
 * overwrite) from one the consumer has edited locally (needs a merge).
 *
 * Node-only: used by the registry build and the CLI, never in the browser.
 */
export function hashContent(content: string): string {
  // Normalize line endings before hashing so a file that differs only by CRLF vs
  // LF — a Windows checkout, git `autocrlf`, or an editor's newline setting —
  // isn't mistaken for a local edit. The registry build and the CLI both hash
  // through here, so they always agree on what "untouched" means.
  const normalized = content.replace(/\r\n?/g, '\n');
  return `sha256:${createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 16)}`;
}
