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
const TODAY_SENSORS = [ENERGY_TODAY.takenFromGrid, ENERGY_TODAY.solarToday];

/**
 * The day tiles under Stroom's card (docs/design/energie-vandaag,
 * docs/design/energie-zon): "Afgenomen vandaag" from the P1 meter, and "Zon
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

  return (
    <div className="day-tiles energy-page__today">
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
          solarKilowattHours={solarTodayInItsUnit * kilowattHoursPerSolarUnit(hass)}
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
