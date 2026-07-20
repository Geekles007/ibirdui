import { describe, expect, it } from 'vitest';
import { registryFileSchema } from './index.js';

describe('registryFileSchema path safety', () => {
  it('accepts a normal project-relative path', () => {
    expect(
      registryFileSchema.safeParse({ path: 'components/button.tsx', content: '' }).success,
    ).toBe(true);
  });

  it('rejects paths that could escape the project', () => {
    for (const path of ['../evil.tsx', 'a/../../evil', '/etc/passwd', 'C:\\evil', '..\\..\\evil']) {
      expect(registryFileSchema.safeParse({ path, content: '' }).success).toBe(false);
    }
  });
});
