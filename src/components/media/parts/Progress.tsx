/** Thin progress track with an accent fill; `fraction` is 0–1. */
export function ProgressTrack({ fraction, knob = false }: { fraction: number; knob?: boolean }) {
  return (
    <span className={`progress-track${knob ? ' progress-track--knob' : ''}`}>
      <i style={{ width: `${Math.min(Math.max(fraction, 0), 1) * 100}%` }} />
    </span>
  );
}

/** "● LIVE": shown instead of a progress bar when there is no duration. */
export function LivePill({ large = false }: { large?: boolean }) {
  return <span className={`live-pill${large ? ' live-pill--large' : ''}`}>Live</span>;
}
