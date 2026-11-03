import { ENERGY_GAS } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { InfoSection, InfoText, readableAmount } from './InfoSheet';
import { MeterSheet } from './MeterSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/**
 * "Gas" (docs/design/energie-sheets), behind "Gas vandaag": the gas meter per
 * hour and per month (winter against summer), with a word on heating.
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
    >
      {() => (
        <InfoSection heading="Goed om te weten">
          <InfoText>
            Gas gaat vooral naar de verwarming en warm water, dus in de winter verbruik je per maand vele keren meer dan in de zomer. De
            verwarming 1 °C lager zetten scheelt ongeveer <strong>7% gas</strong>.
          </InfoText>
          <InfoText>
            De euro's rekenen met € {readableAmount(ENERGY_GAS.euroPerCubicMetre, 2)} per m³, een schatting aan de hoge kant tot de prijs van je
            factuur er is.
          </InfoText>
        </InfoSection>
      )}
    </MeterSheet>
  );
}
