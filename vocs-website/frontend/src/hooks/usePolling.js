import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for periodic data polling with localStorage cache & cleanup
 */
export function usePolling(fetcher, intervalMs = 5000, options = {}) {
  const {
    cacheKey = null,
    initialData = null,
    enabled = true,
    onError = null,
  } = options;

  const [data, setData] = useState(() => {
    if (cacheKey && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return initialData;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const executeFetch = useCallback(async (isInitial = false) => {
    if (!enabled) return;
    if (isInitial) setLoading(true);

    try {
      const result = await fetcherRef.current();
      if (!isMountedRef.current) return;
      setData(result);
      setError(null);
      if (cacheKey && typeof window !== 'undefined' && result !== undefined) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {
          // ignore cache quota
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err);
      if (onError) onError(err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [cacheKey, enabled, onError]);

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(true);

    if (!intervalMs || intervalMs <= 0 || !enabled) return;

    const timer = setInterval(() => {
      executeFetch(false);
    }, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [intervalMs, enabled, executeFetch]);

  const refresh = useCallback(() => executeFetch(false), [executeFetch]);

  return { data, loading, error, refresh, setData };
}

export default usePolling;
