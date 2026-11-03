import { useEffect, useState } from 'react';

/** How often a camera's still image is fetched again, on Thuis and in a room. */
const STILL_IMAGE_REFRESH_MS = 10_000;

/**
 * A timestamp that renews every 10 s, for `stillImageUrl`: each new one makes
 * the browser fetch a fresh still image. It stands still while `isPaused`, e.g.
 * behind the live sheet, where only the camera in view streams.
 */
export function useStillImageRefresh(isPaused: boolean): number {
  const [refreshStamp, setRefreshStamp] = useState(() => Date.now());

  useEffect(() => {
    if (isPaused) return;

    const refreshTimer = window.setInterval(() => setRefreshStamp(Date.now()), STILL_IMAGE_REFRESH_MS);
    return () => window.clearInterval(refreshTimer);
  }, [isPaused]);

  return refreshStamp;
}
