import { ENERGY_GAS } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { MeterSheet } from './MeterSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/**
 * "Gas" (docs/design/energie-sheets), behind "Gas vandaag": the gas meter per
 * hour and per month (winter against summer).
 */
export function GasSheet({ hass, onClose }: Props) {
  const gasTodayCubicMetres = numberState(hass.states, ENERGY_GAS.gasToday);
  if (gasTodayCubicMetres === undefined) return null;

  return (
    <MeterSheet
      hass={hass}
      title="Gas"
      subtitle="Wat de gasmeter telde."
      entityId={ENERGY_GAS.gasToday}
      today={gasTodayCubicMetres}
      unit="m³"
      decimals={2}
      color={ENERGY_GAS.color}
      euroPerUnit={ENERGY_GAS.euroPerCubicMetre}
      onClose={onClose}
    />
  );
}
