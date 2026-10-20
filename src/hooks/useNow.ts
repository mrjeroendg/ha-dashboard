import { useEffect, useState } from 'react';
import { now, subscribeClock } from '../lib/clock';

/** Current time, re-rendered at the start of every minute. */
export function useNow(): Date {
  const [current, setCurrent] = useState(now);

  useEffect(() => {
    const tick = () => setCurrent(now());
    let interval: number | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, msToNextMinute);

    // iOS suspends timers while the app is in the background; refresh on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    const unsubscribe = subscribeClock(tick);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
    };
  }, []);

  return current;
}
