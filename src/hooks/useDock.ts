import { useLayoutEffect, type RefObject } from 'react';

/**
 * Keeps the fixed bottom dock aligned with the dashboard and reserves room for
 * it at the bottom of the page:
 * - the dock is `position: fixed` to the bottom of the screen, so it never
 *   moves or jumps, whatever Home Assistant puts around the dashboard;
 * - it gets the dashboard's left edge and width (HA may show a sidebar);
 * - the dashboard gets bottom padding equal to the dock's height, so nothing
 *   ends up hidden behind it.
 */
export function useDock(main: RefObject<HTMLElement | null>, dock: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const m = main.current;
    const d = dock.current;
    if (!m || !d) return;

    const update = () => {
      const rect = m.getBoundingClientRect();
      d.style.left = `${rect.left}px`;
      d.style.width = `${rect.width}px`;
      m.style.paddingBottom = `${d.offsetHeight}px`;
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(m);
    observer.observe(d);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [main, dock]);
}
