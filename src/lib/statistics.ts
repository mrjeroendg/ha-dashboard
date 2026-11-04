import type { HassEntities } from 'home-assistant-js-websocket';
import type { HomeAssistant } from '../types/hass';

/** The line in each tile: the days before today (docs/design/verbruik); today comes from the state. */
export const PREVIOUS_DAYS_IN_LINE = 6;

interface StatisticsRow {
  start: number | string;
  change?: number | null;
  max?: number | null;
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && !Number.isNaN(value);

/**
 * Whether a daily row is a day before today. HA also returns a row for today
 * (so far) when `end_time` is this morning's midnight; today comes from the
 * state instead.
 */
const isBeforeToday = (dailyRow: { start: number | string }) => {
  const rowStart = typeof dailyRow.start === 'number' ? dailyRow.start : Date.parse(dailyRow.start);
  return rowStart < midnight(0).getTime();
};

/** Local midnight, `daysAgo` days back (0 = this morning). */
function midnight(daysAgo: number) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - daysAgo);
  return day;
}

/**
 * How much each daily sensor counted per day, for the `numberOfDays` days
 * before today, oldest first. HA's `change` handles the reset at midnight. A
 * day without statistics is simply missing.
 */
export async function fetchDailyTotals(
  hass: HomeAssistant,
  entityIds: string[],
  numberOfDays = PREVIOUS_DAYS_IN_LINE,
): Promise<Record<string, number[]>> {
  const statisticsPerEntity = await hass.callWS<Record<string, StatisticsRow[]> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: midnight(numberOfDays).toISOString(),
    end_time: midnight(0).toISOString(),
    statistic_ids: entityIds,
    period: 'day',
    types: ['change'],
  });

  return Object.fromEntries(
    entityIds.map((entityId) => {
      const dailyRows = (statisticsPerEntity?.[entityId] ?? []).filter(isBeforeToday);
      return [entityId, dailyRows.map((dailyRow) => dailyRow.change).filter(isNumber)];
    }),
  );
}

export interface DailyTotal {
  /** Local midnight of the day, in ms. */
  dayStart: number;
  total: number;
}

/**
 * Like `fetchDailyTotals`, but each total with the day it belongs to, for a
 * chart that labels its days (docs/design/day-tile). Oldest first; a day
 * without statistics is missing.
 */
export async function fetchDailyTotalsWithDays(
  hass: HomeAssistant,
  entityIds: string[],
  numberOfDays: number,
): Promise<Record<string, DailyTotal[]>> {
  const statisticsPerEntity = await hass.callWS<Record<string, StatisticsRow[]> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: midnight(numberOfDays).toISOString(),
    end_time: midnight(0).toISOString(),
    statistic_ids: entityIds,
    period: 'day',
    types: ['change'],
  });

  return Object.fromEntries(
    entityIds.map((entityId) => {
      const dailyRows = (statisticsPerEntity?.[entityId] ?? []).filter(isBeforeToday);
      const dailyTotals = dailyRows
        .filter((dailyRow) => isNumber(dailyRow.change))
        .map((dailyRow) => ({
          dayStart: typeof dailyRow.start === 'number' ? dailyRow.start : Date.parse(dailyRow.start),
          total: dailyRow.change as number,
        }));
      return [entityId, dailyTotals];
    }),
  );
}

/** The highest power since midnight, from HA's statistics; undefined when HA has none yet. */
export async function fetchPeakToday(hass: HomeAssistant, powerEntityId: string): Promise<number | undefined> {
  const statisticToday = await hass.callWS<{ max?: number | null } | undefined>({
    type: 'recorder/statistic_during_period',
    statistic_id: powerEntityId,
    calendar: { period: 'day' },
    types: ['max'],
  });

  return isNumber(statisticToday?.max) ? statisticToday.max : undefined;
}

const FIVE_MINUTES = 5 * 60_000;

interface FiveMinuteRow {
  start: number | string;
  mean?: number | null;
}

/**
 * A power sensor's average per 5 minutes over the last `numberOfBars` × 5
 * minutes, oldest first: HA's short-term statistics, what its history graph
 * calls "5-minute aggregated" (time-weighted). The newest is the last 5
 * minutes that are over. A 5 minutes without statistics (e.g. while HA
 * restarted) is `null`.
 */
export async function fetchFiveMinuteAverages(hass: HomeAssistant, entityId: string, numberOfBars: number): Promise<Array<number | null>> {
  const startOfCurrentFiveMinutes = Math.floor(Date.now() / FIVE_MINUTES) * FIVE_MINUTES;
  const startOfFirstBar = startOfCurrentFiveMinutes - numberOfBars * FIVE_MINUTES;
  const statisticsPerEntity = await hass.callWS<Record<string, FiveMinuteRow[]> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: new Date(startOfFirstBar).toISOString(),
    end_time: new Date(startOfCurrentFiveMinutes).toISOString(),
    statistic_ids: [entityId],
    period: '5minute',
    types: ['mean'],
  });

  const rows = statisticsPerEntity?.[entityId] ?? [];
  const valueAt = new Map(rows.map((row) => [typeof row.start === 'number' ? row.start : Date.parse(row.start), row.mean]));
  const barStarts = Array.from({ length: numberOfBars }, (_unused, barNumber) => startOfFirstBar + barNumber * FIVE_MINUTES);

  return barStarts.map((barStart) => {
    const value = valueAt.get(barStart);
    return isNumber(value) ? value : null;
  });
}

/** Local midnight on the 1st of the month, `monthsAgo` months back (0 = this month). */
export function startOfMonth(monthsAgo: number) {
  const firstOfMonth = new Date();
  firstOfMonth.setHours(0, 0, 0, 0);
  firstOfMonth.setDate(1);
  firstOfMonth.setMonth(firstOfMonth.getMonth() - monthsAgo);
  return firstOfMonth;
}

export interface MonthlyPeak {
  /** Local midnight on the 1st of the month, in ms. */
  monthStart: number;
  peakWatts: number;
}

/**
 * The peak of each of the `numberOfMonths` months before this one, oldest
 * first: the highest value on the last day of the month with statistics. A
 * month's peak only rises, so that's the month's peak; the month's own
 * highest value could still hold the previous month's peak from before the
 * meter's reset just after midnight on the 1st. A month without statistics is
 * missing.
 */
export async function fetchEarlierMonthlyPeaks(hass: HomeAssistant, entityId: string, numberOfMonths: number): Promise<MonthlyPeak[]> {
  const statisticsPerEntity = await hass.callWS<Record<string, Array<{ start: number | string; max?: number | null }>> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: startOfMonth(numberOfMonths).toISOString(),
    end_time: startOfMonth(0).toISOString(),
    statistic_ids: [entityId],
    period: 'day',
    types: ['max'],
  });

  const dailyRows = statisticsPerEntity?.[entityId] ?? [];
  // Oldest first, so each month ends up with its last day.
  const peakWattsPerMonthStart = new Map<number, number>();
  for (const dailyRow of dailyRows) {
    if (!isNumber(dailyRow.max)) continue;
    const dayStart = new Date(typeof dailyRow.start === 'number' ? dailyRow.start : Date.parse(dailyRow.start));
    const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1).getTime();
    peakWattsPerMonthStart.set(monthStart, dailyRow.max);
  }

  return [...peakWattsPerMonthStart].map(([monthStart, peakWatts]) => ({ monthStart, peakWatts }));
}

/**
 * When the sensor got its current value this month, from HA's history, in ms;
 * undefined when the history doesn't go back far enough to tell (HA keeps it
 * for about 10 days), or the value hasn't changed this month.
 */
export async function fetchWhenValueWasReachedThisMonth(hass: HomeAssistant, entityId: string): Promise<number | undefined> {
  const historyPerEntity = await hass.callWS<Record<string, Array<{ s: string; lu: number; lc?: number }>> | undefined>({
    type: 'history/history_during_period',
    start_time: startOfMonth(0).toISOString(),
    entity_ids: [entityId],
    minimal_response: true,
    no_attributes: true,
    significant_changes_only: false,
  });

  // Without "unavailable" and the like (e.g. while HA restarts), so the value
  // after it doesn't look new.
  const numberStates = (historyPerEntity?.[entityId] ?? []).filter((historyState) => !Number.isNaN(Number.parseFloat(historyState.s)));
  const currentValue = numberStates.at(-1)?.s;
  // The same value can be recorded more than once in a row; the first of the last run is when it was reached.
  const statesNewestFirst = [...numberStates].reverse();
  const otherValueNewestFirstIndex = statesNewestFirst.findIndex((historyState) => historyState.s !== currentValue);
  if (otherValueNewestFirstIndex === -1) return undefined;

  const reachedState = statesNewestFirst[otherValueNewestFirstIndex - 1];
  return (reachedState.lc ?? reachedState.lu) * 1000;
}

const ONE_HOUR = 3600_000;

const startTimeOf = (row: { start: number | string }) => (typeof row.start === 'number' ? row.start : Date.parse(row.start));

/**
 * How much a daily sensor counted in each hour of today, from midnight, a
 * value per hour (24): HA's hourly long-term statistics (`change`). An hour
 * without statistics yet, like the current one, is `null`.
 */
export async function fetchHourlyTotalsToday(hass: HomeAssistant, entityId: string): Promise<Array<number | null>> {
  const startOfToday = midnight(0).getTime();
  const statisticsPerEntity = await hass.callWS<Record<string, Array<{ start: number | string; change?: number | null }>> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: new Date(startOfToday).toISOString(),
    statistic_ids: [entityId],
    period: 'hour',
    types: ['change'],
  });

  const hourlyRows = statisticsPerEntity?.[entityId] ?? [];
  const totalAt = new Map(hourlyRows.map((hourlyRow) => [startTimeOf(hourlyRow), hourlyRow.change]));

  return Array.from({ length: 24 }, (_unused, hour) => {
    const total = totalAt.get(startOfToday + hour * ONE_HOUR);
    return isNumber(total) ? total : null;
  });
}

/**
 * How much a daily sensor counted in each of the `numberOfMonths` months
 * before this one, by the month's start (local midnight on the 1st): HA's
 * monthly long-term statistics (`change`). A month without statistics is
 * missing.
 */
export async function fetchEarlierMonthlyTotals(hass: HomeAssistant, entityId: string, numberOfMonths: number): Promise<Map<number, number>> {
  const statisticsPerEntity = await hass.callWS<Record<string, Array<{ start: number | string; change?: number | null }>> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: startOfMonth(numberOfMonths).toISOString(),
    end_time: startOfMonth(0).toISOString(),
    statistic_ids: [entityId],
    period: 'month',
    types: ['change'],
  });

  const monthlyRows = (statisticsPerEntity?.[entityId] ?? []).filter((monthlyRow) => isNumber(monthlyRow.change));
  return new Map(
    monthlyRows.map((monthlyRow) => {
      const rowStart = new Date(startTimeOf(monthlyRow));
      const monthStart = new Date(rowStart.getFullYear(), rowStart.getMonth(), 1).getTime();
      return [monthStart, monthlyRow.change as number];
    }),
  );
}

/** A sensor's state as a number, or undefined when it's missing or unavailable. */
export function numberState(states: HassEntities, entityId: string): number | undefined {
  const numberFromEntity = Number.parseFloat(states[entityId]?.state ?? '');
  return Number.isNaN(numberFromEntity) ? undefined : numberFromEntity;
}

export const readableNumber = (value: number, decimals: number) =>
  value.toLocaleString('nl-BE', { maximumFractionDigits: decimals });
