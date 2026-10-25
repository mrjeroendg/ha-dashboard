import { useEffect, useRef, useState } from 'react';

/**
 * A value fetched now, again every `refreshEveryMilliseconds`, and when the app
 * comes back to the foreground (iOS pauses timers in the background). A new
 * `key` (e.g. other entities) fetches right away. Errors keep the last value.
 */
export function usePeriodicFetch<Value>(fetchValue: () => Promise<Value>, key: string, refreshEveryMilliseconds: number) {
  const [fetchedValue, setFetchedValue] = useState<Value | undefined>(undefined);
  // The latest fetcher, so a new `hass` on every state change doesn't restart the timer.
  const latestFetchValue = useRef(fetchValue);
  latestFetchValue.current = fetchValue;

  useEffect(() => {
    let isStillMounted = true;
    const fetchNow = () =>
      latestFetchValue
        .current()
        .then((value) => isStillMounted && setFetchedValue(value))
        .catch((error) => console.error(error));
    const fetchWhenVisibleAgain = () => {
      if (document.visibilityState === 'visible') fetchNow();
    };

    fetchNow();
    const refreshTimer = window.setInterval(fetchNow, refreshEveryMilliseconds);
    document.addEventListener('visibilitychange', fetchWhenVisibleAgain);
    return () => {
      isStillMounted = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', fetchWhenVisibleAgain);
    };
  }, [key, refreshEveryMilliseconds]);

  return fetchedValue;
}
