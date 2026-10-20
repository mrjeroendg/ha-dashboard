import { useEffect, useRef, useState } from 'react';

/**
 * Local "draft" value for sliders: updates instantly while dragging and is
 * sent with `commit` once the user pauses, instead of on every pixel.
 * The draft is dropped after the commit so HA's state takes over again.
 */
export function useDebouncedCommit(
  commit: (value: number) => Promise<unknown>,
  delay = 300,
): [number | null, (value: number) => void] {
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const update = (value: number) => {
    setDraft(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      commit(value)
        .catch((err) => console.error(err))
        .finally(() => setDraft(null));
    }, delay);
  };

  return [draft, update];
}
