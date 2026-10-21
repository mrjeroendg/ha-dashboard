import { useEffect, useState } from 'react';

/**
 * The current time, refreshed every second while `active`. Used to move a
 * progress bar forward between Home Assistant updates (HA only reports the
 * position when something changes, not every second).
 */
export function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}
