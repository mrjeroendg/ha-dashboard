import { useEffect, useState } from 'react';

/** Give up waiting after this long, e.g. when the light can't reach the value. */
const MAX_WAIT_MS = 3000;

/**
 * Bridges the gap between "HA accepted the call" and "HA reports the new
 * state": after a draft is sent, keep showing it until `reported` comes close
 * (or 3 s pass). Without this, a slider jumps back to the old value for a
 * moment before settling on the new one.
 */
export function useSettledDraft(draft: number | null, reported: number | undefined, tolerance: number) {
  const [held, setHeld] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (draft !== null) setHeld(draft);
  }, [draft]);

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

  return draft ?? held ?? reported;
}
