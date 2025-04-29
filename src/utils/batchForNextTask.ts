/**
 * Batches a function for the next JS task.
 *
 * Returns a function that wraps the given callback.
 * @param fn
 * @returns
 */
export function batchForNextTask<T extends (...args: Parameters<T>) => void>(
  fn: T,
) {
  let timeout: NodeJS.Timeout | null = null;
  const wrapper = ((...args: Parameters<T>) => {
    if (timeout != null) return;
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, 0);
  }) as T;
  return wrapper;
}
