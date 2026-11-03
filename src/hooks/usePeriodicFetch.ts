import { useEffect, useEffectEvent, useState } from 'react';

/**
 * A value fetched now, again every `refreshEveryMilliseconds`, and when the app
 * comes back to the foreground (iOS pauses timers in the background). A new
 * `key` (e.g. other entities) fetches right away. Errors keep the last value.
 */
export function usePeriodicFetch<Value>(fetchValue: () => Promise<Value>, key: string, refreshEveryMilliseconds: number) {
  const [fetchedValue, setFetchedValue] = useState<Value>();

  // The timer below starts once, but `fetchValue` is new on every render (with
  // the latest `hass`). An effect event always calls the latest one, without
  // restarting the timer.
  const fetchLatestValue = useEffectEvent(fetchValue);

  useEffect(() => {
    let isStillMounted = true;

    const fetchNow = async () => {
      try {
        const value = await fetchLatestValue();
        if (isStillMounted) setFetchedValue(value);
      } catch (error) {
        console.error(error);
      }
    };
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
