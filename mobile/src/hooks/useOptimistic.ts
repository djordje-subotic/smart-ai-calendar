import { useState, useCallback } from "react";

/**
 * Optimistic state updates - applies change immediately,
 * reverts on error. Use for CRUD operations that should feel instant.
 */
export function useOptimisticState<T>(initial: T) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const applyOptimistic = useCallback(async <R,>(
    update: (prev: T) => T,
    commit: () => Promise<R>,
    options?: { onSuccess?: (result: R) => void; onError?: (err: Error) => void }
  ): Promise<R | null> => {
    const previous = state;
    setError(null);
    setState(update);

    try {
      const result = await commit();
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      // Revert on error
      setState(previous);
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj.message);
      options?.onError?.(errObj);
      return null;
    }
  }, [state]);

  return { state, setState, error, applyOptimistic };
}
