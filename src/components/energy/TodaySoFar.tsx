import { ENERGY_NOW, ENERGY_TODAY } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchDailyTotals, numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { DayTile } from '../DayTile';

interface Props {
  hass: HomeAssistant;
}

/** The days before today don't change during the day; this is plenty. */
const REFRESH_AVERAGES_EVERY_MILLISECONDS = 5 * 60_000;
const TODAY_SENSORS = [ENERGY_TODAY.takenFromGrid, ENERGY_TODAY.fedBackToGrid];

/**
 * "Vandaag tot nu" on the Energie page (docs/design/energie-vandaag, C1): what
 * the P1 meter counted since midnight, taken from the grid and fed back, each
 * against an ordinary day (the average of the 7 days before) and in euros.
 */
export function TodaySoFar({ hass }: Props) {
  const takenFromGridKilowattHours = numberState(hass.states, ENERGY_TODAY.takenFromGrid);
  const fedBackToGridKilowattHours = numberState(hass.states, ENERGY_TODAY.fedBackToGrid);
  const dailyTotalsPerSensor = usePeriodicFetch(
    () => fetchDailyTotals(hass, TODAY_SENSORS, ENERGY_TODAY.daysInAverage),
    TODAY_SENSORS.join(','),
    REFRESH_AVERAGES_EVERY_MILLISECONDS,
  );
  if (takenFromGridKilowattHours === undefined || fedBackToGridKilowattHours === undefined) return null;

  const prices = ENERGY_TODAY.euroPerKilowattHour;

  return (
    <div className="day-tiles energy-page__today">
      <DayTile
        name="Afgenomen"
        icon="pylon"
        color={ENERGY_NOW.fromGridColor}
        value={takenFromGridKilowattHours}
        unit="kWh"
        decimals={2}
        average={averageOf(dailyTotalsPerSensor?.[ENERGY_TODAY.takenFromGrid])}
        euros={takenFromGridKilowattHours * prices.takenFromGrid}
      />
      <DayTile
        name="Teruggeleverd"
        icon="sun"
        color={ENERGY_NOW.backToGridColor}
        value={fedBackToGridKilowattHours}
        unit="kWh"
        decimals={2}
        average={averageOf(dailyTotalsPerSensor?.[ENERGY_TODAY.fedBackToGrid])}
        euros={fedBackToGridKilowattHours * prices.fedBackToGrid}
      />
    </div>
  );
}

/** The average of the days HA has statistics for; nothing while there are none (yet). */
function averageOf(dailyTotals: number[] | undefined): number | undefined {
  if (dailyTotals === undefined || dailyTotals.length === 0) return undefined;
  return dailyTotals.reduce((sum, dailyTotal) => sum + dailyTotal, 0) / dailyTotals.length;
}
