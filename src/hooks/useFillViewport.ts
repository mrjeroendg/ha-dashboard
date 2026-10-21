import { useLayoutEffect, type RefObject } from 'react';

/**
 * Makes the element exactly fill the screen together with whatever Home
 * Assistant puts above and below it, so the docked bar sits at the bottom
 * without adding scroll space. (100vh/100dvh doesn't work inside HA: HA adds
 * space around the dashboard, so it would be too tall by that much.)
 */
export function useFillViewport(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      el.style.minHeight = '';
      const rect = el.getBoundingClientRect();
      // Space HA puts above and below the dashboard, independent of scrolling.
      const above = rect.top + window.scrollY;
      const pageHeight = document.scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight;
      const below = Math.max(0, pageHeight - (rect.bottom + window.scrollY));
      el.style.minHeight = `${Math.max(0, viewport - above - below)}px`;
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [ref]);
}
