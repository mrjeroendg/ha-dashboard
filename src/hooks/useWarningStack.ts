import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** How far each card behind the front one sticks out below it. */
const PEEK_DISTANCE = 6;
/** Each card further back is this much narrower (4.5% per step). */
const SHRINK_PER_STEP = 0.045;
/** Only two cards peek out; the ones further back hide behind them. */
const VISIBLE_CARDS_BEHIND = 2;
const OPACITY_PER_STEP = [1, 0.85, 0.6];

/**
 * Moves the warning banners between the stack and the list
 * (docs/design/warning-stack, motion M1). The banners always sit in the list
 * layout; when stacked, the ones behind the front banner are pulled up under it
 * with a transform, and the stack's height shrinks to the front banner plus the
 * peeking edges. CSS animates both, so opening and closing slide.
 *
 * Returns whether the motion may run: only from the first placement on, so the
 * page doesn't open with the stack folding up.
 */
export function useWarningStack(stackRef: RefObject<HTMLElement | null>, isStacked: boolean, warningCount: number) {
  const [isMotionEnabled, setIsMotionEnabled] = useState(false);

  useEffect(() => {
    const enableMotionAfterFirstPaint = requestAnimationFrame(() => setIsMotionEnabled(true));
    return () => cancelAnimationFrame(enableMotionAfterFirstPaint);
  }, []);

  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const placeBanners = () => {
      const banners = [...stack.children].filter((child): child is HTMLElement => child.classList.contains('attention__item'));
      const frontBannerHeight = banners[0]?.offsetHeight ?? 0;

      banners.forEach((banner, position) => {
        const stepsBehindFront = Math.min(position, VISIBLE_CARDS_BEHIND);
        const scale = 1 - stepsBehindFront * SHRINK_PER_STEP;
        // Where the banner's bottom edge should end up: just below the front banner.
        const peekingBottomEdge = frontBannerHeight + stepsBehindFront * PEEK_DISTANCE;
        const distanceToStack = peekingBottomEdge - banner.offsetTop - banner.offsetHeight * scale;
        const isHiddenBehindOthers = position > VISIBLE_CARDS_BEHIND;

        banner.style.transform = isStacked ? `translateY(${distanceToStack}px) scale(${scale})` : '';
        banner.style.opacity = isStacked ? String(isHiddenBehindOthers ? 0 : OPACITY_PER_STEP[stepsBehindFront]) : '';
      });

      const lastBanner = banners[banners.length - 1];
      const listHeight = lastBanner ? lastBanner.offsetTop + lastBanner.offsetHeight : 0;
      const cardsPeekingOut = Math.min(banners.length - 1, VISIBLE_CARDS_BEHIND);
      const stackHeight = frontBannerHeight + cardsPeekingOut * PEEK_DISTANCE;
      stack.style.height = `${isStacked ? stackHeight : listHeight}px`;
    };

    placeBanners();
    const observer = new ResizeObserver(placeBanners);
    observer.observe(stack);
    return () => observer.disconnect();
  }, [stackRef, isStacked, warningCount]);

  return isMotionEnabled;
}
