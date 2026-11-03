import type { CSSProperties } from 'react';
import { ENERGY_NOW, ENERGY_TODAY } from '../../config/energy';
import { numberState } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { Icon, type IconName } from '../Icon';

interface Props {
  hass: HomeAssistant;
}

/**
 * "Vandaag tot nu" on the Energie page (docs/design/energie-vandaag): what
 * the P1 meter counted since midnight, taken from the grid and fed back, side
 * by side. Live, straight from the daily sensors' states.
 */
export function TodaySoFar({ hass }: Props) {
  const takenFromGridKilowattHours = numberState(hass.states, ENERGY_TODAY.takenFromGrid);
  const fedBackToGridKilowattHours = numberState(hass.states, ENERGY_TODAY.fedBackToGrid);
  if (takenFromGridKilowattHours === undefined || fedBackToGridKilowattHours === undefined) return null;

  return (
    <section>
      <h2 className="section-title">Vandaag tot nu</h2>
      <div className="today-tiles">
        <TodayTile name="Afgenomen" icon="pylon" color={ENERGY_NOW.fromGridColor} kilowattHours={takenFromGridKilowattHours} />
        <TodayTile name="Teruggeleverd" icon="sun" color={ENERGY_NOW.backToGridColor} kilowattHours={fedBackToGridKilowattHours} />
      </div>
    </section>
  );
}

interface TodayTileProps {
  name: string;
  icon: IconName;
  color: string;
  kilowattHours: number;
}

function TodayTile({ name, icon, color, kilowattHours }: TodayTileProps) {
  return (
    <div className="today-tile" style={{ '--today-color': color } as CSSProperties}>
      <p className="today-tile__name">
        <Icon name={icon} />
        {name}
      </p>
      <p className="today-tile__value">
        {kilowattHours.toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <small>kWh</small>
      </p>
    </div>
  );
}
