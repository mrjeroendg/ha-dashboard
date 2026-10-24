/** One open item of the babysit todo list, as the sheet shows it. */
export interface BabysitAppointment {
  id: string;
  /** "Vrijdag 30 oktober", or undefined when the item has no date in front. */
  dateText?: string;
  title: string;
  /** For sorting; undated items go last. */
  date?: Date;
}

/** A todo item as HA sends it (todo/item/subscribe). */
export interface TodoItem {
  uid: string;
  summary: string;
  status: 'needs_action' | 'completed';
}

const DATE_IN_FRONT = /^(\d{1,2})\/(\d{1,2}):\s*(.*)$/;
const BABYSIT_MARK = /^\(BABYSIT\)\s*/i;

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
export function babysitAppointment(item: TodoItem, today = new Date()): BabysitAppointment {
  const dateMatch = item.summary.match(DATE_IN_FRONT);
  if (!dateMatch) return { id: item.uid, title: item.summary.replace(BABYSIT_MARK, '') };

  const [, dayText, monthText, rest] = dateMatch;
  const date = closestDate(Number(dayText), Number(monthText), today);

  return { id: item.uid, dateText: dateText(date), title: rest.replace(BABYSIT_MARK, ''), date };
}

/** The open items, earliest date first; items without a date at the end. */
export function babysitAppointments(items: TodoItem[], today = new Date()): BabysitAppointment[] {
  const openItems = items.filter((item) => item.status === 'needs_action');
  const appointments = openItems.map((item) => babysitAppointment(item, today));
  const sortKey = (appointment: BabysitAppointment) => appointment.date?.getTime() ?? Number.MAX_SAFE_INTEGER;

  return appointments.sort((first, second) => sortKey(first) - sortKey(second));
}

