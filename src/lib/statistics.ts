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
      const dailyRows = statisticsPerEntity?.[entityId] ?? [];
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
      const dailyRows = statisticsPerEntity?.[entityId] ?? [];
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
  change?: number | null;
}

/**
 * A sensor's statistic per 5 minutes over the last `numberOfBars` × 5 minutes,
 * oldest first: HA's short-term statistics, what its history graph calls
 * "5-minute aggregated". `mean` for a power-like sensor (time-weighted),
 * `change` for a meter that counts up (how much it counted). The newest is the
 * last 5 minutes that are over. A 5 minutes without statistics (e.g. while HA
 * restarted) is `null`.
 */
export async function fetchFiveMinuteStatistics(
  hass: HomeAssistant,
  entityId: string,
  statisticType: 'mean' | 'change',
  numberOfBars: number,
): Promise<Array<number | null>> {
  const startOfCurrentFiveMinutes = Math.floor(Date.now() / FIVE_MINUTES) * FIVE_MINUTES;
  const startOfFirstBar = startOfCurrentFiveMinutes - numberOfBars * FIVE_MINUTES;
  const statisticsPerEntity = await hass.callWS<Record<string, FiveMinuteRow[]> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: new Date(startOfFirstBar).toISOString(),
    end_time: new Date(startOfCurrentFiveMinutes).toISOString(),
    statistic_ids: [entityId],
    period: '5minute',
    types: [statisticType],
  });

  const rows = statisticsPerEntity?.[entityId] ?? [];
  const valueAt = new Map(rows.map((row) => [typeof row.start === 'number' ? row.start : Date.parse(row.start), row[statisticType]]));
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

/** A sensor's state as a number, or undefined when it's missing or unavailable. */
export function numberState(states: HassEntities, entityId: string): number | undefined {
  const numberFromEntity = Number.parseFloat(states[entityId]?.state ?? '');
  return Number.isNaN(numberFromEntity) ? undefined : numberFromEntity;
}

export const readableNumber = (value: number, decimals: number) =>
  value.toLocaleString('nl-BE', { maximumFractionDigits: decimals });
