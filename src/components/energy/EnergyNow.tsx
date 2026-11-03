import type { ApexOptions } from 'apexcharts';
import type { CSSProperties } from 'react';
import Chart from 'react-apexcharts/core';
// Only the bar chart and annotations (the zero line): the full ApexCharts
// would add ~0.5 MB to the bundle.
import 'apexcharts/bar';
import 'apexcharts/features/annotations';
import { ENERGY_NOW } from '../../config/energy';
import { useEasedNumber } from '../../hooks/useEasedNumber';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { fetchFiveMinuteAverages, numberState, readableNumber } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
}

/** A new 5 minutes is at most a minute late; the page is rarely open longer. */
const REFRESH_BARS_EVERY_MILLISECONDS = 60_000;
const BARS_HEIGHT = 64;

/**
 * "Nu" on the Energie page (docs/design/energie-nu, option B): what goes
 * through the P1 meter right now, as a number that counts to each new value,
 * in the colour of the bars (pink taking, green feeding back), with the last
 * hour as bars of 5 minutes below it. The top part of the Energie page's
 * card (EnergyPage), without a card of its own.
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
      <LastHourBars hass={hass} />
    </div>
  );
}

/**
 * The last hour as 12 bars, each the average of 5 minutes: pink upwards for
 * taking from the grid, green downwards for feeding back. Fetched again every
 * minute, without animation.
 */
function LastHourBars({ hass }: Props) {
  const fiveMinuteAverages = usePeriodicFetch(
    () => fetchFiveMinuteAverages(hass, ENERGY_NOW.gridPower),
    ENERGY_NOW.gridPower,
    REFRESH_BARS_EVERY_MILLISECONDS,
  );
  const averages = fiveMinuteAverages ?? [];
  const knownAverages = averages.filter((average) => average !== null);

  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: { bar: { columnWidth: '62%', borderRadius: 2 } },
    dataLabels: { enabled: false },
    // Always include zero, with a little room above and below (`|| 1`: an hour of exactly 0 W still gets a range).
    yaxis: { show: false, min: Math.min(0, ...knownAverages) * 1.1, max: Math.max(0, ...knownAverages) * 1.1 || 1 },
    annotations: { yaxis: [{ y: 0, borderColor: 'rgba(245, 244, 239, 0.16)', strokeDashArray: 0 }] },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  };
  const bars = averages.map((average, barNumber) => ({ x: barNumber, y: average, fillColor: colorFor(average ?? 0) }));

  return (
    <div className="energy-card__bars" aria-hidden>
      <Chart type="bar" height={BARS_HEIGHT} width="100%" series={[{ name: 'Gemiddeld per 5 minuten', data: bars }]} options={options} />
      <div className="energy-card__axis">
        <span>1 uur geleden</span>
        <span>nu</span>
      </div>
    </div>
  );
}

const colorFor = (watts: number) => (watts < 0 ? ENERGY_NOW.backToGridColor : ENERGY_NOW.fromGridColor);

/** "850" for −850 W: the label says which way it goes, so no minus sign. */
const readableWatts = (watts: number) => readableNumber(Math.round(Math.abs(watts)), 0);
