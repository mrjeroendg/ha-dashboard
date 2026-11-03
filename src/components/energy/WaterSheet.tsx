import { ENERGY_WATER } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchHasCountedAllNight, numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { InfoNote, InfoSection, InfoText, readableAmount } from './InfoSheet';
import { MeterSheet } from './MeterSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/** Last night doesn't change during the day. */
const REFRESH_NIGHT_EVERY_MILLISECONDS = 30 * 60_000;
const LITRES_PER_CUBIC_METRE = 1000;
/** Rough figures to compare with, not measured. */
const LITRES_PER_SHOWER = 60;
const LITRES_PER_PERSON_PER_DAY = 100;

/**
 * "Water" (docs/design/energie-sheets), behind "Water vandaag": the water
 * meter per hour and per month, a leak check on last night, and today
 * compared with showers and an average person.
 */
export function WaterSheet({ hass, onClose }: Props) {
  const waterTodayCubicMetres = numberState(hass.states, ENERGY_WATER.consumptionToday);
  const hasRunAllNight = usePeriodicFetch(
    () => fetchHasCountedAllNight(hass, ENERGY_WATER.consumptionToday),
    ENERGY_WATER.consumptionToday,
    REFRESH_NIGHT_EVERY_MILLISECONDS,
  );
  if (waterTodayCubicMetres === undefined) return null;

  const waterTodayLitres = waterTodayCubicMetres * LITRES_PER_CUBIC_METRE;
  const showersToday = Math.round(waterTodayLitres / LITRES_PER_SHOWER);

  return (
    <MeterSheet
      hass={hass}
      title="Water"
      subtitle="Wat de watermeter telde."
      entityId={ENERGY_WATER.consumptionToday}
      today={waterTodayLitres}
      unit="l"
      decimals={0}
      color={ENERGY_WATER.color}
      unitsPerSensorUnit={LITRES_PER_CUBIC_METRE}
      euroPerUnit={ENERGY_WATER.euroPerCubicMetre / LITRES_PER_CUBIC_METRE}
      onClose={onClose}
    >
      {() => (
        <>
          {hasRunAllNight !== undefined && (
            <InfoSection heading="Lekcheck">
              {hasRunAllNight ? (
                <InfoNote tone="warning">
                  Vannacht liep er tussen 1 en 5 uur <strong>elke 5 minuten water</strong>. Dat kan een lek zijn, zoals een toilet dat blijft
                  lopen of een kraan die druppelt. Kijk of de watermeter draait als alles dicht is.
                </InfoNote>
              ) : (
                <InfoNote tone="good">Geen lek gezien: vannacht stond het water tussen 1 en 5 uur een tijd helemaal stil.</InfoNote>
              )}
            </InfoSection>
          )}
          <InfoSection heading="Ter vergelijking">
            <InfoText>
              Vandaag is ongeveer <strong>{showersToday === 1 ? '1 douche' : `${showersToday} douches`}</strong> (±{LITRES_PER_SHOWER} liter per
              douche). Iemand in Vlaanderen verbruikt gemiddeld ±{LITRES_PER_PERSON_PER_DAY} liter per dag.
            </InfoText>
            <InfoText>
              De euro's rekenen met € {readableAmount(ENERGY_WATER.euroPerCubicMetre, 2)} per m³, een schatting aan de hoge kant tot de prijs van
              je factuur er is.
            </InfoText>
          </InfoSection>
        </>
      )}
    </MeterSheet>
  );
}
