export type DayPart = 'nacht' | 'ochtend' | 'middag' | 'avond';

export function dayPart(date: Date): DayPart {
  const h = date.getHours();
  if (h < 6 || h >= 22) return 'nacht';
  if (h < 12) return 'ochtend';
  if (h < 18) return 'middag';
  return 'avond';
}

const GREETINGS: Record<DayPart, string> = {
  nacht: 'Goedenacht',
  ochtend: 'Goedemorgen',
  middag: 'Goedemiddag',
  avond: 'Goedenavond',
};

export function greeting(date: Date, name?: string): string {
  const first = name?.trim().split(/\s+/)[0];
  return first ? `${GREETINGS[dayPart(date)]}, ${first}` : GREETINGS[dayPart(date)];
}

const dateFormat = new Intl.DateTimeFormat('nl-BE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** "Dinsdag 20 oktober" */
export function formatDate(date: Date): string {
  const s = dateFormat.format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
