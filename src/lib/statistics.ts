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
 * How much each daily sensor counted per day, for the days before today, oldest
 * first. HA's `change` handles the reset at midnight. A day without statistics
 * is simply missing.
 */
export async function fetchDailyTotals(hass: HomeAssistant, entityIds: string[]): Promise<Record<string, number[]>> {
  const statisticsPerEntity = await hass.callWS<Record<string, StatisticsRow[]> | undefined>({
    type: 'recorder/statistics_during_period',
    start_time: midnight(PREVIOUS_DAYS_IN_LINE).toISOString(),
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

/** A sensor's state as a number, or undefined when it's missing or unavailable. */
export function numberState(states: HassEntities, entityId: string): number | undefined {
  const numberFromEntity = Number.parseFloat(states[entityId]?.state ?? '');
  return Number.isNaN(numberFromEntity) ? undefined : numberFromEntity;
}

export const readableNumber = (value: number, decimals: number) =>
  value.toLocaleString('nl-BE', { maximumFractionDigits: decimals });
