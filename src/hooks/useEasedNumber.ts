import { useEffect, useRef, useState } from 'react';

const EASE_MILLISECONDS = 400;

/**
 * `target`, but moving to each new value in 0.4 s instead of jumping: for a
 * number that counts to its new value. Jumps straight there when `isMotionReduced`.
 */
export function useEasedNumber(target: number, isMotionReduced: boolean): number {
  const [shownValue, setShownValue] = useState(target);
  // Where the number is right now, so a new target eases on from there.
  const shownValueNow = useRef(target);

  useEffect(() => {
    if (isMotionReduced) {
      shownValueNow.current = target;
      setShownValue(target);
      return;
    }

    const startValue = shownValueNow.current;
    const startedAt = performance.now();
    let animationFrame = 0;

    const moveTowardsTarget = (frameTime: number) => {
      const progress = Math.min(1, (frameTime - startedAt) / EASE_MILLISECONDS);
      const easedProgress = 1 - (1 - progress) ** 3;

      shownValueNow.current = startValue + (target - startValue) * easedProgress;
      setShownValue(shownValueNow.current);
      if (progress < 1) animationFrame = requestAnimationFrame(moveTowardsTarget);
    };

    animationFrame = requestAnimationFrame(moveTowardsTarget);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, isMotionReduced]);

  return shownValue;
}
