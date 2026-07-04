import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ROOT_BASE_DIR,
  detectBaseDir,
  displayPath,
  normalizeBaseDir,
  resolveTarget,
} from './paths.js';

describe('normalizeBaseDir', () => {
  it('keeps a plain dir name', () => {
    expect(normalizeBaseDir('src')).toBe('src');
  });

  it('strips a leading ./ and surrounding slashes', () => {
    expect(normalizeBaseDir('./src')).toBe('src');
    expect(normalizeBaseDir('src/')).toBe('src');
    expect(normalizeBaseDir('/app/')).toBe('app');
  });

  it('folds empties and "." down to the repo root', () => {
    expect(normalizeBaseDir('')).toBe(ROOT_BASE_DIR);
    expect(normalizeBaseDir('.')).toBe(ROOT_BASE_DIR);
    expect(normalizeBaseDir('./')).toBe(ROOT_BASE_DIR);
  });
});

describe('resolveTarget', () => {
  it('joins cwd, baseDir and the registry-relative path', () => {
    expect(resolveTarget('/proj', 'src', 'components/button.tsx')).toBe(
      '/proj/src/components/button.tsx',
    );
  });

  it('collapses the root baseDir so nothing extra is inserted', () => {
    expect(resolveTarget('/proj', ROOT_BASE_DIR, 'components/button.tsx')).toBe(
      '/proj/components/button.tsx',
    );
  });
});

describe('displayPath', () => {
  it('prefixes with the base dir when there is one', () => {
    expect(displayPath('src', 'components/button.tsx')).toBe('src/components/button.tsx');
  });

  it('shows the bare registry path at the root', () => {
    expect(displayPath(ROOT_BASE_DIR, 'components/button.tsx')).toBe('components/button.tsx');
  });
});

describe('detectBaseDir', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ibirdui-detect-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns the root when there is no src dir and no tsconfig', () => {
    expect(detectBaseDir(dir)).toBe(ROOT_BASE_DIR);
  });

  it('detects src from an existing top-level src/ directory', () => {
    mkdirSync(join(dir, 'src'));
    expect(detectBaseDir(dir)).toBe('src');
  });

  it('detects src from a tsconfig path alias even before src/ exists', () => {
    writeFileSync(
      join(dir, 'tsconfig.json'),
      // Comments + trailing comma on purpose: real tsconfigs carry JSONC.
      `{
        // TanStack Start style alias
        "compilerOptions": {
          "baseUrl": ".",
          "paths": { "~/*": ["./src/*"], },
        },
      }`,
    );
    expect(detectBaseDir(dir)).toBe('src');
  });

  it('detects src from a tsconfig baseUrl of src', () => {
    writeFileSync(join(dir, 'tsconfig.json'), '{ "compilerOptions": { "baseUrl": "src" } }');
    expect(detectBaseDir(dir)).toBe('src');
  });

  it('stays at root when tsconfig aliases point at the project root', () => {
    writeFileSync(
      join(dir, 'tsconfig.json'),
      '{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./*"] } } }',
    );
    expect(detectBaseDir(dir)).toBe(ROOT_BASE_DIR);
  });
});
