import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ENERGY_QUARTER } from '../../config/energy';
import { useNow } from '../../hooks/useNow';
import { haptic } from '../../lib/haptic';
import { numberState } from '../../lib/statistics';
import { LinkChevron } from '../LinkChevron';
import { CapacitySheet } from './CapacitySheet';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
}

/** The bar runs to 8 kW, or further when a value is higher, so the colours stay in place. */
const SMALLEST_BAR_KILOWATTS = 8;
const MINUTES_PER_QUARTER = 15;

/**
 * "Dit kwartier" on the Energie page (docs/design/energie-kwartier, K1, V2):
 * the average of the current quarter-hour against this month's peak, the two
 * figures the capaciteitstarief is based on. The bar shows the colours up to
 * where it reaches; the white mark is this month's peak. The bottom part of
 * the Energie page's card (EnergyPage), without a card of its own. A tap
 * opens the capaciteitstarief over the year (CapacitySheet); "Piek deze
 * maand ›" shows it.
 */
export function QuarterPeak({ hass }: Props) {
  const now = useNow();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const averageWatts = numberState(hass.states, ENERGY_QUARTER.averageDemand);
  const peakWatts = numberState(hass.states, ENERGY_QUARTER.monthPeak);
  if (averageWatts === undefined || peakWatts === undefined) return null;

  const averageKilowatts = averageWatts / 1000;
  const peakKilowatts = peakWatts / 1000;
  const barKilowatts = Math.max(SMALLEST_BAR_KILOWATTS, averageKilowatts * 1.1, peakKilowatts * 1.1);
  const shareOfBar = (kilowatts: number) => Math.min(1, Math.max(0, kilowatts / barKilowatts));
  // Quarter-hours end at :00, :15, :30 and :45.
  const minutesLeftInQuarter = MINUTES_PER_QUARTER - (now.getMinutes() % MINUTES_PER_QUARTER);

  const averageShare = shareOfBar(averageKilowatts);
  const bar = {
    '--quarter-gradient': gradientAlong(barKilowatts),
    // The fill shows the bar's own gradient, up to where it reaches.
    '--quarter-fill-width': `${averageShare * 100}%`,
    '--quarter-gradient-size': averageShare > 0 ? `${100 / averageShare}% 100%` : '100% 100%',
  } as CSSProperties;

  const openSheet = () => {
    haptic('selection');
    setIsSheetOpen(true);
  };
  const openSheetWithKeyboard = (keyboardEvent: KeyboardEvent) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') openSheet();
  };

  return (
    <>
      <div className="quarter-peak" role="button" tabIndex={0} onClick={openSheet} onKeyDown={openSheetWithKeyboard}>
        <div className="quarter-card__figures">
          <Figure label="Gemiddeld dit kwartier" kilowatts={averageKilowatts} />
          <Figure label="Piek deze maand" kilowatts={peakKilowatts} isRight opensMore />
        </div>
        <div className="quarter-bar" style={bar} aria-hidden>
          <span className="quarter-bar__fill" />
          <span className="quarter-bar__peak" style={{ left: `${shareOfBar(peakKilowatts) * 100}%` }} />
        </div>
        <div className="quarter-bar__marks" aria-hidden>
          {ENERGY_QUARTER.marksAtKilowatts.map((kilowatts, markNumber) => (
            <span key={kilowatts} style={{ left: `${shareOfBar(kilowatts) * 100}%` }}>
              {kilowatts}
              {markNumber === ENERGY_QUARTER.marksAtKilowatts.length - 1 && ' kW'}
            </span>
          ))}
        </div>
        <p className="quarter-card__left">Nog {minutesLeftInQuarter} min</p>
      </div>
      {isSheetOpen && <CapacitySheet hass={hass} onClose={() => setIsSheetOpen(false)} />}
    </>
  );
}

function Figure({ label, kilowatts, isRight, opensMore }: { label: string; kilowatts: number; isRight?: boolean; opensMore?: boolean }) {
  return (
    <div className={`quarter-figure${isRight ? ' quarter-figure--right' : ''}`}>
      <p className="quarter-figure__label">
        {label}
        {opensMore && <LinkChevron />}
      </p>
      <p className="quarter-figure__value" style={{ '--quarter-dot': colorAt(kilowatts) } as CSSProperties}>
        {kilowatts.toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        <small>kW</small>
      </p>
    </div>
  );
}

/** The colours along a bar of `barKilowatts`: green, blending to orange, to dark red. */
function gradientAlong(barKilowatts: number): string {
  const stops = ENERGY_QUARTER.colorStops.map((stop) => `${stop.color} ${(stop.kilowatts / barKilowatts) * 100}%`);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/** The colour for a value: the colour stops' colour, blended between the two it falls between. */
function colorAt(kilowatts: number): string {
  const colorStops = ENERGY_QUARTER.colorStops;
  const nextStopNumber = colorStops.findIndex((stop) => kilowatts <= stop.kilowatts);
  if (nextStopNumber === 0) return colorStops[0].color;
  if (nextStopNumber === -1) return colorStops[colorStops.length - 1].color;

  const previousStop = colorStops[nextStopNumber - 1];
  const nextStop = colorStops[nextStopNumber];
  const shareTowardsNext = (kilowatts - previousStop.kilowatts) / (nextStop.kilowatts - previousStop.kilowatts);

  return `color-mix(in srgb, ${nextStop.color} ${Math.round(shareTowardsNext * 100)}%, ${previousStop.color})`;
}
