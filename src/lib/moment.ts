/** Coarse moments of the day that drive which quick actions are relevant. */
export type Moment = 'ochtend' | 'dag' | 'avond' | 'nacht';

export function momentOf(date: Date): Moment {
  const h = date.getHours();
  if (h >= 6 && h < 11) return 'ochtend';
  if (h >= 11 && h < 17) return 'dag';
  if (h >= 17 && h < 22) return 'avond';
  return 'nacht';
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
}
