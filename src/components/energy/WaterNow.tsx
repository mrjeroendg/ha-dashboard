import type { CSSProperties } from 'react';
import { ENERGY_WATER } from '../../config/energy';
import { useEasedNumber } from '../../hooks/useEasedNumber';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { numberState, readableNumber } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { FiveMinuteBars } from './FiveMinuteBars';

interface Props {
  hass: HomeAssistant;
}

/**
 * The top of the "Water" chip (docs/design/energie-water): the water meter's
 * flow right now, as a number that counts to each new value, blue while water
 * runs and grey when none does, with the last 2 hours as bars of 5 minutes
 * below it (the litres used in each). The top part of the Water card
 * (EnergyPage), like "Nu" on Stroom.
 */
export function WaterNow({ hass }: Props) {
  const currentFlow = numberState(hass.states, ENERGY_WATER.usageNow);
  if (currentFlow === undefined) return null;

  const flowUnit = String(hass.states[ENERGY_WATER.usageNow]?.attributes.unit_of_measurement ?? 'L/min');

  return <WaterFlow hass={hass} currentFlow={currentFlow} flowUnit={flowUnit} />;
}

function WaterFlow({ hass, currentFlow, flowUnit }: Props & { currentFlow: number; flowUnit: string }) {
  const isMotionReduced = usePrefersReducedMotion();
  const shownFlow = useEasedNumber(currentFlow, isMotionReduced);
  const isWaterRunning = currentFlow > 0;
  const flowColor = isWaterRunning ? ENERGY_WATER.color : 'var(--text-muted)';

  return (
    <div className="energy-now" style={{ '--energy-color': flowColor } as CSSProperties}>
      <p className="energy-card__label">{isWaterRunning ? 'Er loopt water' : 'Geen water'}</p>
      <p className="energy-card__value">
        {readableNumber(shownFlow, 1)}
        <small>{flowUnit}</small>
      </p>
      <FiveMinuteBars
        hass={hass}
        entityId={ENERGY_WATER.consumptionToday}
        statisticType="change"
        numberOfBars={ENERGY_WATER.fiveMinuteBars}
        colorFor={() => ENERGY_WATER.color}
        firstBarLabel="2 uur geleden"
      />
    </div>
  );
}
