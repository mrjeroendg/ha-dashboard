import { useEffect, useRef, useState } from 'react';

/**
 * Local "draft" value for sliders and pickers: updates instantly while the
 * user drags and is sent with `commit` once they pause, instead of on every
 * movement. The draft is dropped after the commit so HA's state takes over.
 */
export function useDebouncedCommit<T>(
  commit: (value: T) => Promise<unknown>,
  delay = 300,
): [T | null, (value: T) => void] {
  const [draft, setDraft] = useState<T | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // Bumped on every change, so a slow earlier commit can't clear a newer draft.
  const version = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const update = (value: T) => {
    const current = ++version.current;
    setDraft(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      commit(value)
        .catch((err) => console.error(err))
        .finally(() => {
          if (version.current === current) setDraft(null);
        });
    }, delay);
  };

  return [draft, update];
}
