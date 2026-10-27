import { useEffect, type RefObject } from 'react';
import { scrollParent } from '../lib/scroll';

/**
 * Hides the scrollbar of the element that scrolls the page. That element is
 * Home Assistant's, outside the dashboard's stylesheet, so it gets an inline
 * style while the dashboard is shown, and its own style back afterwards.
 * Runs again once the content is in (`isLoaded`): before that the page may
 * not scroll yet, so the scrolling element can't be found.
 */
export function useHiddenPageScrollbar(dashboard: RefObject<HTMLElement | null>, isLoaded: boolean) {
  useEffect(() => {
    const dashboardElement = dashboard.current;
    if (!dashboardElement) return;

    const pageScroller = scrollParent(dashboardElement) as HTMLElement;
    const scrollbarWidthBefore = pageScroller.style.scrollbarWidth;
    pageScroller.style.scrollbarWidth = 'none';

    return () => {
      pageScroller.style.scrollbarWidth = scrollbarWidthBefore;
    };
  }, [dashboard, isLoaded]);
}
