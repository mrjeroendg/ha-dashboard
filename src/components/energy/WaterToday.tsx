import { useState } from 'react';
import { ENERGY_WATER } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchDailyTotalsWithDays, numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { DayTile } from '../DayTile';
import { WaterSheet } from './WaterSheet';

interface Props {
  hass: HomeAssistant;
}

/** The days before today don't change during the day; this is plenty. */
const REFRESH_DAYS_EVERY_MILLISECONDS = 5 * 60_000;
const LITRES_PER_CUBIC_METRE = 1000;

/**
 * "Water vandaag" on the "Water" chip (docs/design/energie-water): today's
 * water in litres and in euros, with the 13 days before as bars and their
 * average, as a day tile. The meter counts in m³.
 */
export function WaterToday({ hass }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const waterTodayCubicMetres = numberState(hass.states, ENERGY_WATER.consumptionToday);
  const dailyTotalsPerSensor = usePeriodicFetch(
    () => fetchDailyTotalsWithDays(hass, [ENERGY_WATER.consumptionToday], ENERGY_WATER.previousDays),
    ENERGY_WATER.consumptionToday,
    REFRESH_DAYS_EVERY_MILLISECONDS,
  );
  if (waterTodayCubicMetres === undefined) return null;

  const previousDaysInLitres = dailyTotalsPerSensor?.[ENERGY_WATER.consumptionToday]?.map((dailyTotal) => ({
    dayStart: dailyTotal.dayStart,
    total: dailyTotal.total * LITRES_PER_CUBIC_METRE,
  }));

  return (
    <div className="day-tiles energy-page__today">
      <DayTile
        name="Water vandaag"
        icon="droplet"
        color={ENERGY_WATER.color}
        value={waterTodayCubicMetres * LITRES_PER_CUBIC_METRE}
        unit="l"
        decimals={0}
        previousDays={previousDaysInLitres}
        euros={waterTodayCubicMetres * ENERGY_WATER.euroPerCubicMetre}
        onOpen={() => setIsSheetOpen(true)}
      />
      {isSheetOpen && <WaterSheet hass={hass} onClose={() => setIsSheetOpen(false)} />}
    </div>
  );
}
