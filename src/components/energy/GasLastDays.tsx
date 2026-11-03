import { ENERGY_GAS } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchDailyTotalsWithDays, numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { DayTile } from '../DayTile';

interface Props {
  hass: HomeAssistant;
}

/** The days before today don't change during the day; this is plenty. */
const REFRESH_DAYS_EVERY_MILLISECONDS = 5 * 60_000;

/**
 * The "Gas" chip on the Energie page (docs/design/energie-gas): today's gas in
 * m³ and in euros, with the 13 days before as bars and their average, as a
 * day tile.
 */
export function GasLastDays({ hass }: Props) {
  const gasTodayCubicMetres = numberState(hass.states, ENERGY_GAS.gasToday);
  const dailyTotalsPerSensor = usePeriodicFetch(
    () => fetchDailyTotalsWithDays(hass, [ENERGY_GAS.gasToday], ENERGY_GAS.previousDays),
    ENERGY_GAS.gasToday,
    REFRESH_DAYS_EVERY_MILLISECONDS,
  );
  if (gasTodayCubicMetres === undefined) return null;

  return (
    <div className="day-tiles">
      <DayTile
        name="Gas vandaag"
        icon="flame"
        color={ENERGY_GAS.color}
        value={gasTodayCubicMetres}
        unit="m³"
        decimals={2}
        previousDays={dailyTotalsPerSensor?.[ENERGY_GAS.gasToday]}
        euros={gasTodayCubicMetres * ENERGY_GAS.euroPerCubicMetre}
      />
    </div>
  );
}
