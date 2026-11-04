import type { CSSProperties } from 'react';
import { ENERGY_NOW } from '../../config/energy';
import { useEasedNumber } from '../../hooks/useEasedNumber';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { numberState, readableNumber } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { FiveMinuteBars } from './FiveMinuteBars';

interface Props {
  hass: HomeAssistant;
}

/**
 * "Nu" on the Energie page (docs/design/energie-nu, option B): what goes
 * through the P1 meter right now, as a number that counts to each new value,
 * in the colour of the bars (blue taking, green feeding back), with the last
 * 2 hours as bars of 5 minutes below it (each the average). The top part of the
 * Energie page's card (EnergyPage), without a card of its own.
 */
export function EnergyNow({ hass }: Props) {
  const currentWatts = numberState(hass.states, ENERGY_NOW.gridPower);
  if (currentWatts === undefined) return null;

  return <GridPower hass={hass} currentWatts={currentWatts} />;
}

function GridPower({ hass, currentWatts }: Props & { currentWatts: number }) {
  const isMotionReduced = usePrefersReducedMotion();
  const shownWatts = useEasedNumber(currentWatts, isMotionReduced);
  const isFeedingBack = shownWatts < 0;

  return (
    <div className="energy-now" style={{ '--energy-color': colorFor(shownWatts) } as CSSProperties}>
      <p className="energy-card__label">{isFeedingBack ? 'Terug naar het net' : 'Van het net'}</p>
      <p className="energy-card__value">
        {readableWatts(shownWatts)}
        <small>W</small>
      </p>
      <FiveMinuteBars
        hass={hass}
        entityId={ENERGY_NOW.gridPower}
        numberOfBars={ENERGY_NOW.fiveMinuteBars}
        colorFor={colorFor}
        firstBarLabel="2 uur geleden"
      />
    </div>
  );
}

const colorFor = (watts: number) => (watts < 0 ? ENERGY_NOW.backToGridColor : ENERGY_NOW.fromGridColor);

/** "850" for −850 W: the label says which way it goes, so no minus sign. */
const readableWatts = (watts: number) => readableNumber(Math.round(Math.abs(watts)), 0);
