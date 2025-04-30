import { useCallback, useEffect, useRef } from 'react';

export default function useResizeObserver<T extends Element>(
  element: T | null,
  callback: (entry: ResizeObserverEntry) => void,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      callbackRef.current(entry);
    }
  }, []);

  const observerRef = useRef<ResizeObserver>(null);

  useEffect(() => {
    observerRef.current = new ResizeObserver(handleResize);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleResize]);

  useEffect(() => {
    const observer = observerRef.current;

    if (observer && element) {
      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }
    return undefined;
  }, [element]);
}
