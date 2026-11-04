import { ENERGY_TODAY } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { InfoFigure, InfoFigures, InfoSection, readableAmount, readableEuros } from './InfoSheet';

const HOURS_PER_YEAR = 24 * 365;

/**
 * "Sluipverbruik" (docs/design/energie-sheets), from Smappee: "Altijd aan", the
 * lowest power of the last 2 days, with what that is over a year, and
 * "Vandaag", what it used since midnight. Nothing without the sensor.
 */
export function AlwaysOnSection({ hass }: { hass: HomeAssistant }) {
  const alwaysOnWatts = numberState(hass.states, ENERGY_TODAY.alwaysOnPower);
  const alwaysOnTodayKilowattHours = kilowattHoursOf(hass, ENERGY_TODAY.alwaysOnToday);
  if (alwaysOnWatts === undefined) return null;

  const euroPerKilowattHour = ENERGY_TODAY.euroPerKilowattHour.takenFromGrid;

  return (
    <InfoSection heading="Sluipverbruik">
      <InfoFigures>
        <AlwaysOnFigure alwaysOnWatts={alwaysOnWatts} euroPerKilowattHour={euroPerKilowattHour} />
        {alwaysOnTodayKilowattHours !== undefined && (
          <InfoFigure
            label="Vandaag"
            value={readableAmount(alwaysOnTodayKilowattHours, 2)}
            unit="kWh"
            detail={`≈ ${readableEuros(alwaysOnTodayKilowattHours * euroPerKilowattHour)}`}
          />
        )}
      </InfoFigures>
    </InfoSection>
  );
}

/** "Altijd aan 138 W", with what that is over a year: "≈ 1.209 kWh · € 423 per jaar". */
function AlwaysOnFigure({ alwaysOnWatts, euroPerKilowattHour }: { alwaysOnWatts: number; euroPerKilowattHour: number }) {
  const yearlyKilowattHours = (alwaysOnWatts * HOURS_PER_YEAR) / 1000;
  const yearlyEuros = yearlyKilowattHours * euroPerKilowattHour;

  return (
    <InfoFigure
      label="Altijd aan"
      value={readableAmount(alwaysOnWatts, 0)}
      unit="W"
      detail={`≈ ${readableAmount(yearlyKilowattHours, 0)} kWh · ${readableEuros(yearlyEuros)} per jaar`}
    />
  );
}

/** An energy sensor's state in kWh, also when it counts in Wh (like Smappee); undefined when it's unavailable. */
function kilowattHoursOf(hass: HomeAssistant, entityId: string) {
  const amountInItsUnit = numberState(hass.states, entityId);
  if (amountInItsUnit === undefined) return undefined;

  const isInWattHours = hass.states[entityId]?.attributes.unit_of_measurement === 'Wh';
  return isInWattHours ? amountInItsUnit / 1000 : amountInItsUnit;
}
