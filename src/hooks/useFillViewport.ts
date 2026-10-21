import { useLayoutEffect, type RefObject } from 'react';

/** The element that actually scrolls the page, also through HA's shadow DOM. */
export function scrollParent(el: Element): Element {
  let node: Node | null = el.parentNode;
  while (node) {
    if (node instanceof ShadowRoot) {
      node = node.host;
      continue;
    }
    if (node instanceof Element) {
      const { overflowY } = getComputedStyle(node);
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    }
    node = node.parentNode;
  }
  return document.scrollingElement ?? document.documentElement;
}

/**
 * Makes the element exactly fill the visible area together with whatever
 * Home Assistant puts above and below it, so the docked bar sits at the bottom
 * without adding scroll space. (100vh/100dvh doesn't work inside HA: HA adds
 * space around the dashboard, so it would be too tall by that much.)
 */
export function useFillViewport(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      el.style.minHeight = '';
      const scroller = scrollParent(el);
      const isPage = scroller === document.scrollingElement || scroller === document.documentElement;
      const visible = isPage ? (window.visualViewport?.height ?? window.innerHeight) : scroller.clientHeight;
      const scrollerTop = isPage ? 0 : scroller.getBoundingClientRect().top;

      // Space above and below the dashboard inside the scroller, independent of scrolling.
      const rect = el.getBoundingClientRect();
      const above = rect.top - scrollerTop + scroller.scrollTop;
      const below = Math.max(0, scroller.scrollHeight - (above + rect.height));
      el.style.minHeight = `${Math.max(0, visible - above - below)}px`;
    };

    update();
    // HA lays out its view after we mount; measure again once it has settled.
    const late = window.setTimeout(update, 300);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.clearTimeout(late);
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [ref]);
}
