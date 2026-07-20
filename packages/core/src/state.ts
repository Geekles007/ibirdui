/**
 * The async contract every ibirdui component speaks.
 *
 * A component never invents its own loading / error / empty handling — it accepts
 * an `AsyncState<T>` and renders the matching slot. This single type is what makes
 * ibirdui components "state-complete": the five real-world states of any async UI
 * are modelled once, here, instead of being re-implemented per component.
 */
/**
 * The runtime states a component can be in. Kept as a runtime tuple so it's the
 * single source of truth for both the {@link AsyncStatus} union below and the
 * registry's `states` capability vocabulary (`asyncStateNameSchema`) — the two
 * used to be hand-maintained parallel lists and had drifted apart.
 */
export const ASYNC_STATUSES = ['idle', 'loading', 'empty', 'error', 'success'] as const;

export type AsyncStatus = (typeof ASYNC_STATUSES)[number];

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; error: Error; retry?: () => void }
  | { status: 'success'; data: T };

export const idle = (): AsyncState<never> => ({ status: 'idle' });
export const loading = (): AsyncState<never> => ({ status: 'loading' });
export const empty = (): AsyncState<never> => ({ status: 'empty' });
export const error = (e: Error, retry?: () => void): AsyncState<never> => ({
  status: 'error',
  error: e,
  retry,
});
export const success = <T>(data: T): AsyncState<T> => ({ status: 'success', data });

export interface FromResultOptions<T> {
  /** Force the error state regardless of `data`. */
  error?: Error;
  /** Decide whether a resolved value should render the dedicated empty slot. */
  isEmpty?: (data: T) => boolean;
}

/**
 * Normalize a fetched value into an `AsyncState`. A resolved-but-empty value
 * (empty array, null) becomes the dedicated `empty` state so the component shows
 * an empty slot instead of a blank success render. `undefined` is treated as
 * still-loading.
 */
export function fromResult<T>(
  data: T | undefined,
  options: FromResultOptions<T> = {},
): AsyncState<T> {
  if (options.error) return { status: 'error', error: options.error };
  if (data === undefined) return { status: 'loading' };
  const isEmpty = options.isEmpty ?? defaultIsEmpty;
  return isEmpty(data) ? { status: 'empty' } : { status: 'success', data };
}

function defaultIsEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  return data == null;
}
