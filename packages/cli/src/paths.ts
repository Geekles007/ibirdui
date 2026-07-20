import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

/**
 * The repo root — the back-compat default. Registry files (components/, hooks/,
 * lib/, styles/) are written directly under the project root, exactly as every
 * lockfile written before `baseDir` existed expects.
 */
export const ROOT_BASE_DIR = '.';

/**
 * Normalize a user-supplied `--dir` value into a `baseDir`: strip a leading
 * `./` and any surrounding slashes, and fold empties / `.` down to the root.
 * `"src"`, `"./src"`, `"src/"` all become `"src"`; `""`, `"."`, `"./"` → `"."`.
 */
export function normalizeBaseDir(dir: string): string {
  const trimmed = dir
    .trim()
    .replace(/^\.\//, '')
    .replace(/^\/+|\/+$/g, '');
  return trimmed === '' || trimmed === '.' ? ROOT_BASE_DIR : trimmed;
}

/**
 * Resolve cwd + baseDir + a registry-relative file path into an absolute target,
 * refusing to escape the install directory. A hostile or typo'd registry item
 * whose `path` is absolute or contains `..` (e.g. `../../.git/hooks/pre-commit`)
 * would otherwise let `add`/`upgrade` write anywhere the user can — so we confine
 * every write under `cwd/baseDir` and throw if it would land outside.
 */
export function resolveTarget(cwd: string, baseDir: string, filePath: string): string {
  const root = resolve(cwd, baseDir);
  const target = resolve(root, filePath);
  const rel = relative(root, target);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Refusing to write outside ${root}: "${filePath}"`);
  }
  return target;
}

/**
 * The path we show the user — the registry-relative path prefixed with the base
 * dir when there is one. Always forward-slashed, so it reads the same on every
 * platform (registry paths are already posix).
 */
export function displayPath(baseDir: string, filePath: string): string {
  return baseDir === ROOT_BASE_DIR ? filePath : `${baseDir}/${filePath}`;
}

/**
 * Best-effort detection of a project's source root, so `add` lands files where
 * the framework actually expects them. We deliberately don't key off the
 * framework *name* — Next.js alone officially supports both a `src/` layout and
 * a root layout — but off the real project layout:
 *
 *   1. a tsconfig/jsconfig path alias or baseUrl pointing into `src/`  → "src"
 *   2. an existing top-level `src/` directory                          → "src"
 *   3. otherwise                                                       → "." (root)
 *
 * TanStack Start, src-based Next and src-based Vite all resolve to `"src"`; a
 * plain Next app-router or Vite project at the root resolves to `"."`.
 */
export function detectBaseDir(cwd: string): string {
  if (tsconfigPointsToSrc(cwd)) return 'src';
  if (isDir(join(cwd, 'src'))) return 'src';
  return ROOT_BASE_DIR;
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * True when the nearest ts/jsconfig maps an alias (or baseUrl) into `src/`.
 * Parsed tolerantly: tsconfig files routinely carry `//` comments and trailing
 * commas that plain `JSON.parse` rejects.
 */
function tsconfigPointsToSrc(cwd: string): boolean {
  for (const name of ['tsconfig.json', 'jsconfig.json']) {
    const file = join(cwd, name);
    if (!existsSync(file)) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonc(readFileSync(file, 'utf8')));
    } catch {
      continue;
    }
    const options = getRecord(getRecord(parsed).compilerOptions);

    const baseUrl = options.baseUrl;
    if (typeof baseUrl === 'string' && /^\.?\/?src\/?$/.test(baseUrl.trim())) return true;

    const paths = getRecord(options.paths);
    for (const targets of Object.values(paths)) {
      if (!Array.isArray(targets)) continue;
      for (const target of targets) {
        if (typeof target === 'string' && /(^|\/)src\//.test(target.replace(/^\.\//, ''))) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Narrow an unknown JSON node to a plain object, or an empty one. */
function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Strip `/* *​/` and `//` comments and trailing commas from a JSONC string. */
function stripJsonc(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:"])\/\/.*$/gm, '$1')
    .replace(/,(\s*[}\]])/g, '$1');
}
