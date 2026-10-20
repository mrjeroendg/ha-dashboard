/**
 * Single source of "now" for the dashboard. Normally the real time; in dev the
 * toolbar can pin it to e.g. Saturday 10:00 to preview time-dependent UI.
 */
type Listener = () => void;

let override: Date | null = null;
const listeners = new Set<Listener>();

export function now(): Date {
  return override ? new Date(override) : new Date();
}

export function setClockOverride(date: Date | null) {
  override = date;
  listeners.forEach((l) => l());
}

export function subscribeClock(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
