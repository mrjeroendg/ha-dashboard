import { ENERGY_TODAY } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { InfoFigure, InfoFigures, InfoNote, InfoSection, InfoText, readableAmount, readableEuros } from './InfoSheet';
import { MeterSheet } from './MeterSheet';
import { kilowattHoursPerSolarUnit } from './solarUnits';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/**
 * "Zon" (docs/design/energie-sheets), behind "Zon vandaag": what the panels
 * made (Smappee), per hour and per month, where today's went (used or
 * injected, the P1 meter), and why using it yourself pays.
 */
export function SolarSheet({ hass, onClose }: Props) {
  const solarTodayInItsUnit = numberState(hass.states, ENERGY_TODAY.solarToday);
  const injectedTodayKilowattHours = numberState(hass.states, ENERGY_TODAY.fedBackToGrid);
  if (solarTodayInItsUnit === undefined) return null;

  // Smappee can report a hair below zero at night (e.g. −0,01 kWh); no solar is 0.
  const solarTodayKilowattHours = Math.max(0, solarTodayInItsUnit * kilowattHoursPerSolarUnit(hass));
  const euroPerKilowattHour = ENERGY_TODAY.euroPerKilowattHour.takenFromGrid;

  return (
    <MeterSheet
      hass={hass}
      title="Zon"
      subtitle="Wat je zonnepanelen opbrachten."
      entityId={ENERGY_TODAY.solarToday}
      today={solarTodayKilowattHours}
      unit="kWh"
      decimals={2}
      color={ENERGY_TODAY.solarColor}
      unitsPerSensorUnit={kilowattHoursPerSolarUnit(hass)}
      onClose={onClose}
    >
      {() => {
        const hasSolarToday = solarTodayKilowattHours > 0 && injectedTodayKilowattHours !== undefined;
        // Smappee and the P1 meter measure apart, so injecting can come out a little above the solar.
        const injectedKilowattHours = Math.min(injectedTodayKilowattHours ?? 0, solarTodayKilowattHours);
        const usedKilowattHours = solarTodayKilowattHours - injectedKilowattHours;
        const shareOf = (kilowattHours: number) => `${Math.round((kilowattHours / solarTodayKilowattHours) * 100)}% van je zon`;

        return (
          <>
            {hasSolarToday && (
              <InfoSection heading="Waar ging je zon heen vandaag">
                <InfoFigures>
                  <InfoFigure label="Verbruikt" value={readableAmount(usedKilowattHours, 2)} unit="kWh" detail={shareOf(usedKilowattHours)} />
                  <InfoFigure
                    label="Geïnjecteerd"
                    value={readableAmount(injectedKilowattHours, 2)}
                    unit="kWh"
                    detail={shareOf(injectedKilowattHours)}
                  />
                </InfoFigures>
                <InfoText>
                  De zonnestroom die je zelf verbruikte, hoefde je niet te kopen: vandaag ≈{' '}
                  <strong>{readableEuros(usedKilowattHours * euroPerKilowattHour)}</strong> bespaard (aan € {readableAmount(euroPerKilowattHour, 2)}{' '}
                  per kWh).
                </InfoText>
              </InfoSection>
            )}
            <InfoSection heading="Goed om te weten">
              <InfoNote>
                Voor geïnjecteerde stroom krijg je veel minder dan je voor stroom van het net betaalt. Zet de wasmachine, de vaatwasser of de
                droogkast daarom liefst aan als de zon schijnt.
              </InfoNote>
            </InfoSection>
          </>
        );
      }}
    </MeterSheet>
  );
}
