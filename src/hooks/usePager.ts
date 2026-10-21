import { useCallback, useRef, useState } from 'react';

/**
 * Horizontal pager on top of CSS scroll snapping: tracks which page is in
 * view (for the dots) and can jump to a page without animation.
 */
export function usePager() {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  const jumpTo = useCallback((index: number) => {
    const el = ref.current;
    if (el) el.scrollLeft = index * el.clientWidth;
    setPage(index);
  }, []);

  return { ref, page, onScroll, jumpTo };
}
