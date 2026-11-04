import { ENERGY_NOW, ENERGY_TODAY } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchLowestHourlyAverageLastNight, numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { InfoFigure, InfoFigures, InfoSection, readableAmount, readableEuros } from './InfoSheet';
import { MeterSheet } from './MeterSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/** Last night doesn't change during the day. */
const REFRESH_NIGHT_EVERY_MILLISECONDS = 30 * 60_000;
const HOURS_PER_YEAR = 24 * 365;

/**
 * "Afgenomen" (docs/design/energie-sheets), behind "Afgenomen vandaag": what
 * the house took from the grid, per hour and per month, and what it always
 * uses at night (sluipverbruik), with what that costs per year.
 */
export function ElectricitySheet({ hass, onClose }: Props) {
  const takenTodayKilowattHours = numberState(hass.states, ENERGY_TODAY.takenFromGrid);
  const lowestNightWatts = usePeriodicFetch(
    () => fetchLowestHourlyAverageLastNight(hass, ENERGY_NOW.gridPower),
    ENERGY_NOW.gridPower,
    REFRESH_NIGHT_EVERY_MILLISECONDS,
  );
  if (takenTodayKilowattHours === undefined) return null;

  const euroPerKilowattHour = ENERGY_TODAY.euroPerKilowattHour.takenFromGrid;
  const yearlyEurosFor = (watts: number) => ((watts * HOURS_PER_YEAR) / 1000) * euroPerKilowattHour;
  const hasStandby = lowestNightWatts !== undefined && lowestNightWatts > 0;

  return (
    <MeterSheet
      hass={hass}
      title="Afgenomen"
      subtitle="Wat je van het net nam."
      entityId={ENERGY_TODAY.takenFromGrid}
      today={takenTodayKilowattHours}
      unit="kWh"
      decimals={2}
      color={ENERGY_NOW.fromGridColor}
      euroPerUnit={euroPerKilowattHour}
      onClose={onClose}
    >
      {() =>
        hasStandby && (
          <InfoSection heading="Sluipverbruik">
            <InfoFigures>
              <InfoFigure label="'s Nachts altijd" value={readableAmount(lowestNightWatts, 0)} unit="W" detail="het laagste uur tussen 1 en 5 uur" />
              <InfoFigure
                label="Per jaar"
                value={readableAmount((lowestNightWatts * HOURS_PER_YEAR) / 1000, 0)}
                unit="kWh"
                detail={`≈ ${readableEuros(yearlyEurosFor(lowestNightWatts))}`}
              />
            </InfoFigures>
          </InfoSection>
        )
      }
    </MeterSheet>
  );
}
