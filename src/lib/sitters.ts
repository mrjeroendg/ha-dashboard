import type { TodoItem } from '../types/hass';

/**
 * The sitter todo lists (docs/design/babysit): the babysitter for Marielou and
 * the catsitter for Cara. Their automations write items like
 * "30/10: (BABYSIT) Etentje bij Jan" or "30/10: (CARA) Weekend weg".
 */

/** One open item of a sitter todo list, as the sheet shows it. */
export interface SitterAppointment {
  id: string;
  /** "Vrijdag 30 oktober", or undefined when the item has no date in front. */
  dateText?: string;
  title: string;
  /** For sorting; undated items go last. */
  date?: Date;
}

const DATE_IN_FRONT = /^(\d{1,2})\/(\d{1,2}):\s*(.*)$/;

/** The mark in front of an item's title, left out in the sheet. */
export const BABYSIT_MARK = /^\(BABYSIT\)\s*/i;
export const CATSIT_MARK = /^\(CARA\)\s*/i;

/**
 * The automation writes "dd/mm" without a year. Take the year that puts the
 * date closest to today, so "05/01" in December means next January.
 */
function closestDate(day: number, month: number, today: Date): Date {
  const candidateYears = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];
  const candidates = candidateYears.map((year) => new Date(year, month - 1, day));
  const distanceToToday = (candidate: Date) => Math.abs(candidate.getTime() - today.getTime());

  return candidates.reduce((closest, candidate) => (distanceToToday(candidate) < distanceToToday(closest) ? candidate : closest));
}

function dateText(date: Date): string {
  const longDate = date.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });

  return longDate.charAt(0).toUpperCase() + longDate.slice(1);
}

/** "30/10: (BABYSIT) Etentje bij Jan" → "Vrijdag 30 oktober" and "Etentje bij Jan". */
export function sitterAppointment(item: TodoItem, sitterMark: RegExp, today = new Date()): SitterAppointment {
  const dateMatch = item.summary.match(DATE_IN_FRONT);
  if (!dateMatch) return { id: item.uid, title: item.summary.replace(sitterMark, '') };

  const [, dayText, monthText, rest] = dateMatch;
  const date = closestDate(Number(dayText), Number(monthText), today);

  return { id: item.uid, dateText: dateText(date), title: rest.replace(sitterMark, ''), date };
}

/** The open items, earliest date first; items without a date at the end. */
export function sitterAppointments(items: TodoItem[], sitterMark: RegExp, today = new Date()): SitterAppointment[] {
  const openItems = items.filter((item) => item.status === 'needs_action');
  const appointments = openItems.map((item) => sitterAppointment(item, sitterMark, today));
  const sortKey = (appointment: SitterAppointment) => appointment.date?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return appointments.sort((first, second) => sortKey(first) - sortKey(second));
}

