import { useEffect, type RefObject } from 'react';
import { scrollParent } from '../lib/scroll';

/**
 * While a sheet is open, the page behind it doesn't scroll: the element that
 * scrolls the page (in HA an element of its own layout, not the document) gets
 * `overflow: hidden`, and dragging on the dimmed backdrop does nothing (iOS
 * would otherwise still drag the page). Scrolling inside the sheet keeps working.
 */
export function useLockPageScroll(sheetRef: RefObject<HTMLElement | null>, backdropRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet) return;

    const pageScroller = scrollParent(sheet) as HTMLElement;
    const overflowBeforeSheet = pageScroller.style.overflow;
    pageScroller.style.overflow = 'hidden';

    const ignoreDragOnBackdrop = (touchEvent: TouchEvent) => touchEvent.preventDefault();
    backdrop?.addEventListener('touchmove', ignoreDragOnBackdrop, { passive: false });

    return () => {
      pageScroller.style.overflow = overflowBeforeSheet;
      backdrop?.removeEventListener('touchmove', ignoreDragOnBackdrop);
    };
  }, [sheetRef, backdropRef]);
}
