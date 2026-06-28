import { hashContent } from 'ibirdui-core';
import { describe, expect, it } from 'vitest';
import { type ItemReport, diffFile, isOutdated, summarize } from './doctor.js';

describe('diffFile', () => {
  const content = 'export const x = 1;\n';
  const hash = hashContent(content);

  it('reports clean when on-disk content matches the locked hash', () => {
    expect(diffFile(hash, content)).toBe('clean');
  });

  it('reports modified when content has drifted from the locked hash', () => {
    expect(diffFile(hash, `${content}// edited\n`)).toBe('modified');
  });

  it('reports missing when the file is gone', () => {
    expect(diffFile(hash, null)).toBe('missing');
  });
});

describe('isOutdated', () => {
  const base: ItemReport = { name: 'x', version: '1.0.0', latest: null, files: [] };

  it('is false when the registry was not checked', () => {
    expect(isOutdated(base)).toBe(false);
  });

  it('is false when pinned equals latest', () => {
    expect(isOutdated({ ...base, latest: '1.0.0' })).toBe(false);
  });

  it('is true when the registry advertises a different version', () => {
    expect(isOutdated({ ...base, latest: '1.1.0' })).toBe(true);
  });
});

describe('summarize', () => {
  it('counts clean items, drifted files and updates', () => {
    const reports: ItemReport[] = [
      {
        name: 'clean-item',
        version: '1.0.0',
        latest: '1.0.0',
        files: [{ path: 'a.tsx', state: 'clean' }],
      },
      {
        name: 'edited-item',
        version: '1.0.0',
        latest: '1.1.0',
        files: [
          { path: 'b.tsx', state: 'modified' },
          { path: 'c.tsx', state: 'missing' },
        ],
      },
    ];

    expect(summarize(reports)).toEqual({
      items: 2,
      clean: 1,
      modified: 1,
      missing: 1,
      outdated: 1,
    });
  });

  it('treats an item with only clean files as clean even when outdated', () => {
    const reports: ItemReport[] = [
      {
        name: 'outdated-but-untouched',
        version: '1.0.0',
        latest: '2.0.0',
        files: [{ path: 'a.tsx', state: 'clean' }],
      },
    ];

    const summary = summarize(reports);
    expect(summary.clean).toBe(1);
    expect(summary.outdated).toBe(1);
    expect(summary.modified).toBe(0);
  });
});
