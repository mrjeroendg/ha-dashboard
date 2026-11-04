import { ENERGY_NOW, ENERGY_TODAY } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { InfoFigure, InfoFigures, InfoSection, readableAmount, readableEuros } from './InfoSheet';
import { MeterSheet } from './MeterSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

const HOURS_PER_YEAR = 24 * 365;

/**
 * "Afgenomen" (docs/design/energie-sheets), behind "Afgenomen vandaag": what
 * the house took from the grid, per hour and per month, and its sluipverbruik
 * from Smappee: what always runs (the lowest power of the last 2 days), with
 * what that is per year, and what it used today.
 */
export function ElectricitySheet({ hass, onClose }: Props) {
  const takenTodayKilowattHours = numberState(hass.states, ENERGY_TODAY.takenFromGrid);
  const alwaysOnWatts = numberState(hass.states, ENERGY_TODAY.alwaysOnPower);
  const alwaysOnTodayKilowattHours = kilowattHoursOf(hass, ENERGY_TODAY.alwaysOnToday);
  if (takenTodayKilowattHours === undefined) return null;

  const euroPerKilowattHour = ENERGY_TODAY.euroPerKilowattHour.takenFromGrid;

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
        alwaysOnWatts !== undefined && (
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
        )
      }
    </MeterSheet>
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
