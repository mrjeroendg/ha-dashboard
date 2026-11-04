import { ENERGY_TODAY } from '../../config/energy';
import type { HomeAssistant } from '../../types/hass';
import { AlwaysOnSection } from './AlwaysOnSection';
import { InfoFigure, InfoFigures, InfoSheet, readableAmount } from './InfoSheet';

interface Props {
  hass: HomeAssistant;
  /** As on the tile: taken from the grid + own solar. */
  houseKilowattHours: number;
  ownSolarKilowattHours: number;
  takenFromGridKilowattHours: number;
  onClose(): void;
}

/**
 * "Huis" (docs/design/energie-huis), behind "Huis vandaag": what the house used
 * today, how much of it came from the sun and from the grid, and its
 * sluipverbruik (Smappee's always-on).
 */
export function HouseSheet({ hass, houseKilowattHours, ownSolarKilowattHours, takenFromGridKilowattHours, onClose }: Props) {
  const hasUsedAnything = houseKilowattHours > 0;
  const shareOfHouse = (kilowattHours: number) =>
    hasUsedAnything ? `${Math.round((kilowattHours / houseKilowattHours) * 100)}% van je huis` : undefined;

  return (
    <InfoSheet
      title="Huis"
      subtitle={`Vandaag ${readableAmount(houseKilowattHours, 2)} kWh, van de zon en van het net.`}
      onClose={onClose}
    >
      <InfoFigures>
        <InfoFigure
          label="Zon"
          value={readableAmount(ownSolarKilowattHours, 2)}
          unit="kWh"
          detail={shareOfHouse(ownSolarKilowattHours)}
        />
        <InfoFigure
          label="Net"
          value={readableAmount(takenFromGridKilowattHours, 2)}
          unit="kWh"
          detail={shareOfHouse(takenFromGridKilowattHours)}
        />
      </InfoFigures>
      <AlwaysOnSection hass={hass} />
    </InfoSheet>
  );
}
