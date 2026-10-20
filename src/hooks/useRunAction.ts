import { useEffect, useRef, useState } from 'react';

export type RunStatus = 'idle' | 'busy' | 'done' | 'error';

/** Runs an async action and exposes a short-lived status for tap feedback. */
export function useRunAction(): [RunStatus, (fn: () => Promise<unknown>) => void] {
  const [status, setStatus] = useState<RunStatus>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = (fn: () => Promise<unknown>) => {
    if (status === 'busy') return;
    window.clearTimeout(timer.current);
    setStatus('busy');
    fn()
      .then(() => setStatus('done'))
      .catch((err) => {
        console.error(err);
        setStatus('error');
      })
      .finally(() => {
        timer.current = window.setTimeout(() => setStatus('idle'), 1600);
      });
  };

  return [status, run];
}
