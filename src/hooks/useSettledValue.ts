import { useEffect, useState } from 'react';

/** Give up waiting after this long, e.g. when the light can't reach the value. */
const MAX_WAIT_MS = 3000;

/**
 * Bridges the gap between "the value was sent" and "HA reports the new state":
 * `hold(value)` on release keeps showing that value until `reported` comes
 * close (or 3 s pass). Without this, a slider jumps back to the old value for
 * a moment before settling on the new one.
 */
export function useSettledValue(
  reported: number | undefined,
  tolerance: number,
): [number | undefined, (value: number) => void] {
  const [held, setHeld] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (held === undefined) return;
    const arrived = reported !== undefined && Math.abs(reported - held) <= tolerance;
    if (arrived) {
      setHeld(undefined);
      return;
    }
    const timer = window.setTimeout(() => setHeld(undefined), MAX_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [held, reported, tolerance]);

  return [held, setHeld];
}
