import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Whether the device asks for less motion (iOS: Settings → Accessibility → Motion). */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const followSetting = () => setPrefersReducedMotion(reducedMotionQuery.matches);

    reducedMotionQuery.addEventListener('change', followSetting);
    return () => reducedMotionQuery.removeEventListener('change', followSetting);
  }, []);

  return prefersReducedMotion;
}
