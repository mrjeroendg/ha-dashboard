import { useEffect, useRef, useState } from 'react';

export interface PowerSample {
  /** When it was taken, in ms (`Date.now()`). */
  time: number;
  watts: number;
}

/** A new point every 4 s; the P1 meter reaches HA about every 3 s, so no value is taken twice. */
export const SAMPLE_EVERY_MILLISECONDS = 4_000;
/** How far back the line goes: from the left edge to "nu". */
export const REMEMBER_MILLISECONDS = 30_000;

/**
 * The live line's points (docs/design/energie-nu): the current power every 4 s,
 * starting when the card appears. Points older than 30 s are forgotten, except
 * the one just past the left edge, so the line runs all the way to it.
 */
export function useLivePowerSamples(currentWatts: number | undefined): PowerSample[] {
  const [samples, setSamples] = useState<PowerSample[]>(() => (currentWatts === undefined ? [] : [{ time: Date.now(), watts: currentWatts }]));
  // The latest value, so a new state from HA doesn't restart the timer.
  const latestWatts = useRef(currentWatts);
  latestWatts.current = currentWatts;

  useEffect(() => {
    const takeSample = () => {
      const watts = latestWatts.current;
      if (watts === undefined) return;

      const sampleTime = Date.now();
      setSamples((previousSamples) => withoutForgottenSamples([...previousSamples, { time: sampleTime, watts }], sampleTime));
    };

    const sampleTimer = window.setInterval(takeSample, SAMPLE_EVERY_MILLISECONDS);
    return () => window.clearInterval(sampleTimer);
  }, []);

  return samples;
}

function withoutForgottenSamples(samples: PowerSample[], now: number): PowerSample[] {
  const leftEdgeTime = now - REMEMBER_MILLISECONDS;
  const firstVisibleSample = samples.findIndex((sample) => sample.time >= leftEdgeTime);
  const hasSamplePastTheLeftEdge = firstVisibleSample > 0;

  return hasSamplePastTheLeftEdge ? samples.slice(firstVisibleSample - 1) : samples;
}
