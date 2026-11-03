import type { ReactNode } from 'react';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import {
  type DailyTotal,
  fetchDailyTotalsWithDays,
  fetchEarlierMonthlyTotals,
  fetchHourlyTotalsToday,
  startOfMonth,
} from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import {
  hourLabels,
  InfoBarChart,
  InfoFigure,
  InfoFigures,
  InfoSection,
  InfoSheet,
  InfoText,
  monthName,
  readableAmount,
  readableDay,
  readableEuros,
} from './InfoSheet';

/** What a meter's sheet knows, in the sheet's unit, for its own sections. */
export interface MeterHistory {
  today: number;
  thisMonth: number;
  /** The last 30 days before today, oldest first. */
  previousDays: DailyTotal[];
}

interface Props {
  hass: HomeAssistant;
  title: string;
  subtitle: string;
  /** The daily sensor (resets at midnight), with statistics in HA. */
  entityId: string;
  /** Today so far, from the state, in the sheet's unit. */
  today: number;
  unit: string;
  decimals: number;
  color: string;
  /** From the sensor's unit to the sheet's, e.g. 1000 for m³ to litres. */
  unitsPerSensorUnit?: number;
  /** € per unit of the sheet, for "≈ €"; without it, no euros. */
  euroPerUnit?: number;
  onClose(): void;
  /** The sheet's own sections, below the shared ones. */
  children?: (meterHistory: MeterHistory) => ReactNode;
}

/** The hours and days before now don't change; this is plenty. */
const REFRESH_EVERY_MILLISECONDS = 5 * 60_000;
const PREVIOUS_DAYS = 30;
const EARLIER_MONTHS = 12;
const MONTHS_IN_CHART = 12;

/**
 * The sheet behind a day tile (docs/design/energie-sheets): today and this
 * month (with euros and what the same month cost last year), today per hour,
 * and the last 12 months, then the sheet's own sections.
 */
export function MeterSheet(props: Props) {
  const { hass, title, subtitle, entityId, today, unit, decimals, color, unitsPerSensorUnit = 1, euroPerUnit, onClose, children } = props;
  const hourlyTotalsToday = usePeriodicFetch(() => fetchHourlyTotalsToday(hass, entityId), entityId, REFRESH_EVERY_MILLISECONDS);
  const dailyTotalsPerSensor = usePeriodicFetch(
    () => fetchDailyTotalsWithDays(hass, [entityId], PREVIOUS_DAYS),
    entityId,
    REFRESH_EVERY_MILLISECONDS,
  );
  const earlierMonthlyTotals = usePeriodicFetch(
    () => fetchEarlierMonthlyTotals(hass, entityId, EARLIER_MONTHS),
    entityId,
    REFRESH_EVERY_MILLISECONDS,
  );

  const toSheetUnit = (amountInSensorUnit: number) => amountInSensorUnit * unitsPerSensorUnit;
  const readable = (amount: number) => readableAmount(amount, decimals);

  const previousDays = (dailyTotalsPerSensor?.[entityId] ?? []).map((dailyTotal) => ({
    dayStart: dailyTotal.dayStart,
    total: toSheetUnit(dailyTotal.total),
  }));
  const thisMonthStart = startOfMonth(0).getTime();
  const earlierDaysThisMonth = previousDays.filter((previousDay) => previousDay.dayStart >= thisMonthStart);
  const thisMonth = earlierDaysThisMonth.reduce((sum, previousDay) => sum + previousDay.total, today);

  const hourlyTotals = hoursWithCurrentHour((hourlyTotalsToday ?? []).map((total) => (total === null ? null : toSheetUnit(total))), today);

  const monthStarts = Array.from({ length: MONTHS_IN_CHART }, (_unused, monthNumber) => startOfMonth(MONTHS_IN_CHART - 1 - monthNumber).getTime());
  const monthlyTotalOf = (monthStart: number) => {
    const totalInSensorUnit = earlierMonthlyTotals?.get(monthStart);
    return totalInSensorUnit === undefined ? null : toSheetUnit(totalInSensorUnit);
  };
  const monthlyTotals = monthStarts.map((monthStart) => (monthStart === thisMonthStart ? thisMonth : monthlyTotalOf(monthStart)));
  const knownEarlierMonthlyTotals = monthlyTotals.slice(0, -1).filter((total) => total !== null);
  const averageEarlierMonth =
    knownEarlierMonthlyTotals.length > 0 ? knownEarlierMonthlyTotals.reduce((sum, total) => sum + total, 0) / knownEarlierMonthlyTotals.length : undefined;

  const sameMonthLastYear = monthlyTotalOf(startOfMonth(12).getTime());
  const eurosFor = (amount: number) => (euroPerUnit === undefined ? undefined : `≈ ${readableEuros(amount * euroPerUnit)}`);
  const hasHours = hourlyTotals.some((total) => total !== null && total > 0);
  const hasMonths = knownEarlierMonthlyTotals.length > 0;

  return (
    <InfoSheet title={title} subtitle={subtitle} onClose={onClose}>
      <InfoFigures>
        <InfoFigure label="Vandaag" value={readable(today)} unit={unit} detail={eurosFor(today)} />
        <InfoFigure label="Deze maand" value={readable(thisMonth)} unit={unit} detail={eurosFor(thisMonth)} />
      </InfoFigures>

      {hasHours && (
        <InfoSection heading="Vandaag per uur">
          <InfoBarChart labels={hourLabels()} values={hourlyTotals} color={color} nowIndex={new Date().getHours()} />
        </InfoSection>
      )}

      {hasMonths && (
        <InfoSection heading="Laatste 12 maanden">
          <InfoBarChart
            labels={monthStarts.map(monthName)}
            values={monthlyTotals}
            color={color}
            average={averageEarlierMonth === undefined ? undefined : { value: averageEarlierMonth, label: `gem. ${readable(averageEarlierMonth)}` }}
          />
          <InfoText>
            {capitalised(fullMonthName(thisMonthStart))} loopt nog
            {sameMonthLastYear === null ? '.' : <>; vorig jaar was het in totaal <strong>{readable(sameMonthLastYear)} {unit}</strong>.</>}
          </InfoText>
        </InfoSection>
      )}

      {previousDays.length > 0 && <LastThirtyDays previousDays={previousDays} unit={unit} readable={readable} />}

      {children?.({ today, thisMonth, previousDays })}
    </InfoSheet>
  );
}

/** "november": a month's full name in Dutch. */
const fullMonthName = (moment: number) => new Date(moment).toLocaleDateString('nl-BE', { month: 'long' });

const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The average day and the highest day of the last 30 days. */
function LastThirtyDays({ previousDays, unit, readable }: { previousDays: DailyTotal[]; unit: string; readable(amount: number): string }) {
  const averageDay = previousDays.reduce((sum, previousDay) => sum + previousDay.total, 0) / previousDays.length;
  const highestDay = previousDays.reduce((highest, previousDay) => (previousDay.total > highest.total ? previousDay : highest));

  return (
    <InfoSection heading={`Laatste ${previousDays.length} dagen`}>
      <InfoFigures>
        <InfoFigure label="Gemiddeld per dag" value={readable(averageDay)} unit={unit} />
        <InfoFigure label="Hoogste dag" value={readable(highestDay.total)} unit={unit} detail={readableDay(highestDay.dayStart)} />
      </InfoFigures>
    </InfoSection>
  );
}

/**
 * Today's hours, with the current hour filled in: HA has no statistics for it
 * yet, so it's today so far minus the hours before it. The hours after it stay
 * empty (`null`).
 */
function hoursWithCurrentHour(hourlyTotals: Array<number | null>, today: number) {
  if (hourlyTotals.length === 0) return [];

  const currentHour = new Date().getHours();
  const totalOfEarlierHours = hourlyTotals.slice(0, currentHour).reduce<number>((sum, total) => sum + (total ?? 0), 0);
  const currentHourTotal = Math.max(0, today - totalOfEarlierHours);

  return hourlyTotals.map((total, hour) => (hour === currentHour ? currentHourTotal : hour > currentHour ? null : total));
}
