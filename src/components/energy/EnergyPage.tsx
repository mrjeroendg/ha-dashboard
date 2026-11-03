import type { HomeAssistant } from '../../types/hass';
import { EnergyNow } from './EnergyNow';
import { QuarterPeak } from './QuarterPeak';
import { TodaySoFar } from './TodaySoFar';

interface Props {
  hass: HomeAssistant;
}

/**
 * The Energie page's content (docs/design/energie-page, S2), without section
 * titles: one card for what's happening now (the power with its 5-minute bars,
 * a thin line, then the quarter-hour), and the day tiles below it.
 */
export function EnergyPage({ hass }: Props) {
  return (
    <>
      <div className="energy-card energy-page__now">
        <EnergyNow hass={hass} />
        <QuarterPeak hass={hass} />
      </div>
      <TodaySoFar hass={hass} />
    </>
  );
}
