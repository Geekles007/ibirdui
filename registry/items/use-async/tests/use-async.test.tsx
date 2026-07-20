// Resolved via the vitest aliases (registry/vitest.config.ts), mirroring the
// "@/..." paths a consumer gets after `ibirdui add`.
import { useAsync } from '@/hooks/use-async';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

describe('useAsync', () => {
  it('goes loading → success', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve([1, 2, 3]), []));

    // synchronous first render is the loading state
    expect(result.current.state.status).toBe('loading');

    await waitFor(() => expect(result.current.state.status).toBe('success'));
    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toEqual([1, 2, 3]);
    }
  });

  it('maps a resolved-but-empty value to the empty state', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve([] as number[]), []));
    await waitFor(() => expect(result.current.state.status).toBe('empty'));
  });

  it('captures errors and exposes a retry that re-runs the fetcher', async () => {
    const fetcher = vi
      .fn<() => Promise<number[]>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([42]);

    const { result } = renderHook(() => useAsync(fetcher, []));

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    if (result.current.state.status === 'error') {
      expect(result.current.state.error.message).toBe('network');
      expect(result.current.state.retry).toBeTypeOf('function');
    }

    // retry → second call resolves
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not run while disabled', async () => {
    const fetcher = vi.fn(() => Promise.resolve(1));
    const { result } = renderHook(() => useAsync(fetcher, [], { enabled: false }));
    expect(result.current.state.status).toBe('idle');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('keeps data on screen while refetching (stale-while-revalidate)', async () => {
    let resolveSecond!: (v: number[]) => void;
    const secondFetch = new Promise<number[]>((r) => {
      resolveSecond = r;
    });
    const fetcher = vi
      .fn<() => Promise<number[]>>()
      .mockResolvedValueOnce([1])
      .mockReturnValueOnce(secondFetch);

    const { result } = renderHook(() => useAsync(fetcher, []));
    await waitFor(() => expect(result.current.state.status).toBe('success'));

    // Refetch: the old data stays visible, flagged refreshing — no blank skeleton.
    act(() => result.current.refetch());
    expect(result.current.state.status).toBe('success');
    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toEqual([1]);
      expect(result.current.state.refreshing).toBe(true);
    }

    // When the refetch lands, fresh data replaces it and refreshing clears.
    await act(async () => {
      resolveSecond([1, 2]);
    });
    expect(result.current.state.status).toBe('success');
    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toEqual([1, 2]);
      expect(result.current.state.refreshing).toBeFalsy();
    }
  });
});
