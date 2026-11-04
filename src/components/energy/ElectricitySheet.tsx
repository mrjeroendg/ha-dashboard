import { ENERGY_NOW, ENERGY_TODAY } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { MeterSheet } from './MeterSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/**
 * "Afgenomen" (docs/design/energie-sheets), behind "Afgenomen vandaag": what
 * the house took from the grid, per hour and per month. The sluipverbruik is
 * in the Huis sheet: it's what the house uses, from the grid or the sun.
 */
export function ElectricitySheet({ hass, onClose }: Props) {
  const takenTodayKilowattHours = numberState(hass.states, ENERGY_TODAY.takenFromGrid);
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
    />
  );
}
