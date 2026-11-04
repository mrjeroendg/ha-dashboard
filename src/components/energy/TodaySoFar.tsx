import { useState, type CSSProperties } from 'react';
import { ENERGY_NOW, ENERGY_TODAY } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { type DailyTotal, fetchDailyTotalsWithDays, numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { DayTile } from '../DayTile';
import { SplitBar } from '../SplitBar';
import { ElectricitySheet } from './ElectricitySheet';
import { SolarSheet } from './SolarSheet';
import { kilowattHoursPerSolarUnit } from './solarUnits';

interface Props {
  hass: HomeAssistant;
}

/** The days before today don't change during the day; this is plenty. */
const REFRESH_AVERAGES_EVERY_MILLISECONDS = 5 * 60_000;
const TODAY_SENSORS = [ENERGY_TODAY.takenFromGrid, ENERGY_TODAY.solarToday, ENERGY_TODAY.fedBackToGrid];

/**
 * The day tiles under Stroom's card (docs/design/energie-vandaag,
 * docs/design/energie-zon, docs/design/energie-huis): "Huis vandaag", what the
 * house used (from the grid + own solar), "Afgenomen vandaag" from the P1 meter, and "Zon
 * vandaag" from Smappee, split into what the house used itself and what went
 * back to the grid (the P1 meter's feeding back, in red: it's worth little).
 * Each with the 13 days before as bars (docs/design/day-tile, D2); only
 * Afgenomen in euros.
 */
export function TodaySoFar({ hass }: Props) {
  const [openSheet, setOpenSheet] = useState<'electricity' | 'solar'>();
  const closeSheet = () => setOpenSheet(undefined);
  const takenFromGridKilowattHours = numberState(hass.states, ENERGY_TODAY.takenFromGrid);
  const fedBackToGridKilowattHours = numberState(hass.states, ENERGY_TODAY.fedBackToGrid);
  const solarTodayInItsUnit = numberState(hass.states, ENERGY_TODAY.solarToday);
  const dailyTotalsPerSensor = usePeriodicFetch(
    () => fetchDailyTotalsWithDays(hass, TODAY_SENSORS, ENERGY_TODAY.previousDays),
    TODAY_SENSORS.join(','),
    REFRESH_AVERAGES_EVERY_MILLISECONDS,
  );
  if (takenFromGridKilowattHours === undefined) return null;

  const prices = ENERGY_TODAY.euroPerKilowattHour;
  const isSolarKnown = solarTodayInItsUnit !== undefined && fedBackToGridKilowattHours !== undefined;

  const solarKilowattHoursPerUnit = kilowattHoursPerSolarUnit(hass);
  // Smappee can report a hair below zero at night (e.g. −0,01 kWh); no solar is 0.
  const solarTodayKilowattHours = Math.max(0, (solarTodayInItsUnit ?? 0) * solarKilowattHoursPerUnit);

  return (
    <div className="day-tiles energy-page__today">
      {isSolarKnown && (
        <HouseToday
          takenFromGridKilowattHours={takenFromGridKilowattHours}
          solarKilowattHours={solarTodayKilowattHours}
          fedBackToGridKilowattHours={fedBackToGridKilowattHours}
          previousDays={houseDays(dailyTotalsPerSensor, solarKilowattHoursPerUnit)}
        />
      )}
      <DayTile
        name="Afgenomen vandaag"
        icon="pylon"
        color={ENERGY_NOW.fromGridColor}
        value={takenFromGridKilowattHours}
        unit="kWh"
        decimals={2}
        previousDays={dailyTotalsPerSensor?.[ENERGY_TODAY.takenFromGrid]}
        euros={takenFromGridKilowattHours * prices.takenFromGrid}
        onOpen={() => setOpenSheet('electricity')}
      />
      {isSolarKnown && (
        <SolarToday
          solarKilowattHours={solarTodayKilowattHours}
          fedBackToGridKilowattHours={fedBackToGridKilowattHours}
          onOpen={() => setOpenSheet('solar')}
          previousDays={dailyTotalsPerSensor?.[ENERGY_TODAY.solarToday]?.map((dailyTotal) => ({
            dayStart: dailyTotal.dayStart,
            total: dailyTotal.total * kilowattHoursPerSolarUnit(hass),
          }))}
        />
      )}
      {openSheet === 'electricity' && <ElectricitySheet hass={hass} onClose={closeSheet} />}
      {openSheet === 'solar' && <SolarSheet hass={hass} onClose={closeSheet} />}
    </div>
  );
}

interface HouseDay {
  dayStart: number;
  /** Taken from the grid + own solar. */
  total: number;
  /** The part of it from own solar: solar − injected. */
  ownSolar: number;
}

/**
 * The days before today for Huis vandaag, from the daily statistics of the
 * three sensors: each day taken from the grid, plus that day's solar minus
 * what was injected. A day without solar statistics counts no own solar.
 */
function houseDays(dailyTotalsPerSensor: Record<string, DailyTotal[]> | undefined, solarKilowattHoursPerUnit: number): HouseDay[] | undefined {
  if (dailyTotalsPerSensor === undefined) return undefined;

  const totalOnDay = (entityId: string, dayStart: number) =>
    dailyTotalsPerSensor[entityId]?.find((dailyTotal) => dailyTotal.dayStart === dayStart)?.total;

  return (dailyTotalsPerSensor[ENERGY_TODAY.takenFromGrid] ?? []).map((takenOnDay) => {
    const solarOnDay = (totalOnDay(ENERGY_TODAY.solarToday, takenOnDay.dayStart) ?? 0) * solarKilowattHoursPerUnit;
    const injectedOnDay = totalOnDay(ENERGY_TODAY.fedBackToGrid, takenOnDay.dayStart) ?? 0;
    const ownSolar = Math.max(0, solarOnDay - injectedOnDay);

    return { dayStart: takenOnDay.dayStart, total: takenOnDay.total + ownSolar, ownSolar };
  });
}

interface HouseTodayProps {
  takenFromGridKilowattHours: number;
  solarKilowattHours: number;
  fedBackToGridKilowattHours: number;
  previousDays?: HouseDay[];
}

/**
 * "Huis vandaag" (docs/design/energie-huis, H3): what the house used today, from
 * the grid and from its own solar, as a split bar ("Zon", "Net"), and each of
 * the days before split the same way (own solar at the bottom).
 */
function HouseToday({ takenFromGridKilowattHours, solarKilowattHours, fedBackToGridKilowattHours, previousDays }: HouseTodayProps) {
  // Smappee and the P1 meter measure apart, so injecting can come out a little above the solar.
  const ownSolarKilowattHours = Math.max(0, solarKilowattHours - fedBackToGridKilowattHours);
  const houseKilowattHours = takenFromGridKilowattHours + ownSolarKilowattHours;
  const hasUsedAnything = houseKilowattHours > 0;
  const ownSolarPercentage = hasUsedAnything ? Math.round((ownSolarKilowattHours / houseKilowattHours) * 100) : 0;

  return (
    <DayTile
      name="Huis vandaag"
      icon="home"
      color={ENERGY_NOW.fromGridColor}
      iconColor={ENERGY_TODAY.houseColor}
      value={houseKilowattHours}
      unit="kWh"
      decimals={2}
      previousDays={previousDays}
      bottomPart={
        previousDays && {
          color: ENERGY_TODAY.solarColor,
          earlierDaysColor: ENERGY_TODAY.solarEarlierDaysColor,
          previousDays: previousDays.map((previousDay) => previousDay.ownSolar),
          today: ownSolarKilowattHours,
        }
      }
    >
      {hasUsedAnything && (
        <div className="solar-split">
          <SplitBar
            parts={[
              { value: ownSolarKilowattHours, color: ENERGY_TODAY.solarColor },
              { value: takenFromGridKilowattHours, color: ENERGY_NOW.fromGridColor },
            ]}
          />
          <p className="solar-split__legend">
            <span style={{ '--solar-split-color': ENERGY_TODAY.solarColor } as CSSProperties}>
              Zon <strong>{readableKilowattHours(ownSolarKilowattHours)} · {ownSolarPercentage}%</strong>
            </span>
            <span style={{ '--solar-split-color': ENERGY_NOW.fromGridColor } as CSSProperties}>
              Net <strong>{readableKilowattHours(takenFromGridKilowattHours)}</strong>
            </span>
          </p>
        </div>
      )}
    </DayTile>
  );
}

interface SolarTodayProps {
  solarKilowattHours: number;
  fedBackToGridKilowattHours: number;
  previousDays?: DailyTotal[];
  onOpen(): void;
}

function SolarToday({ solarKilowattHours, fedBackToGridKilowattHours, previousDays, onOpen }: SolarTodayProps) {
  // Smappee and the P1 meter measure apart, so feeding back can come out a little above the solar.
  const usedYourselfKilowattHours = Math.max(0, solarKilowattHours - fedBackToGridKilowattHours);
  const hasSolarToday = solarKilowattHours > 0;
  const usedYourselfPercentage = hasSolarToday ? Math.round((usedYourselfKilowattHours / solarKilowattHours) * 100) : 0;

  return (
    <DayTile
      name="Zon vandaag"
      icon="sun"
      color={ENERGY_TODAY.solarColor}
      earlierDaysColor={ENERGY_TODAY.solarEarlierDaysColor}
      value={solarKilowattHours}
      unit="kWh"
      decimals={2}
      previousDays={previousDays}
      onOpen={onOpen}
    >
      {hasSolarToday && (
        <div className="solar-split">
          <SplitBar
            parts={[
              { value: usedYourselfKilowattHours, color: ENERGY_TODAY.solarColor },
              { value: fedBackToGridKilowattHours, color: ENERGY_TODAY.solarFedBackColor },
            ]}
          />
          <p className="solar-split__legend">
            <span style={{ '--solar-split-color': ENERGY_TODAY.solarColor } as CSSProperties}>
              Verbruikt <strong>{readableKilowattHours(usedYourselfKilowattHours)} · {usedYourselfPercentage}%</strong>
            </span>
            <span style={{ '--solar-split-color': ENERGY_TODAY.solarFedBackColor } as CSSProperties}>
              Geïnjecteerd <strong>{readableKilowattHours(fedBackToGridKilowattHours)}</strong>
            </span>
          </p>
        </div>
      )}
    </DayTile>
  );
}

const readableKilowattHours = (kilowattHours: number) =>
  kilowattHours.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
