import type { ApexOptions } from 'apexcharts';
import type { CSSProperties } from 'react';
import Chart from 'react-apexcharts/core';
// Only the area chart and annotations (the zero line): the full ApexCharts
// would add ~0.5 MB to the bundle.
import 'apexcharts/area';
import 'apexcharts/features/annotations';
import { ENERGY_NOW } from '../../config/energy';
import { useEasedNumber } from '../../hooks/useEasedNumber';
import { REMEMBER_MILLISECONDS, SAMPLE_EVERY_MILLISECONDS, useLivePowerSamples } from '../../hooks/useLivePowerSamples';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { numberState, readableNumber } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
}

const CHART_HEIGHT = 130;

/**
 * "Nu" on the Energie page (docs/design/energie-nu): what goes through the P1
 * meter right now, as a number that counts to each new value, and a live line
 * of the last 30 s.
 */
export function EnergyNow({ hass }: Props) {
  const currentWatts = numberState(hass.states, ENERGY_NOW.gridPower);
  if (currentWatts === undefined) return null;

  return (
    <section>
      <h2 className="section-title energy-now__title">
        Nu
        <span className="energy-now__live">live</span>
      </h2>
      <GridPowerCard currentWatts={currentWatts} />
    </section>
  );
}

function GridPowerCard({ currentWatts }: { currentWatts: number }) {
  const isMotionReduced = usePrefersReducedMotion();
  const shownWatts = useEasedNumber(currentWatts, isMotionReduced);
  const isFeedingBack = shownWatts < 0;
  const color = isFeedingBack ? ENERGY_NOW.backToGridColor : ENERGY_NOW.fromGridColor;

  return (
    <div className="energy-card" style={{ '--energy-color': color } as CSSProperties}>
      <p className="energy-card__label">{isFeedingBack ? 'Terug naar het net' : 'Van het net'}</p>
      <p className="energy-card__value">
        {readableWatts(shownWatts)}
        <small>W</small>
      </p>
      <LivePowerLine currentWatts={currentWatts} />
    </div>
  );
}

/**
 * The last 30 s, a point every 4 s, the newest at the right edge. ApexCharts
 * scrolls the line itself (`xaxis.range`), and colours it pink above zero and
 * green below (`plotOptions.line.colors`).
 */
function LivePowerLine({ currentWatts }: { currentWatts: number }) {
  const samples = useLivePowerSamples(currentWatts);
  // ApexCharts recognises a scroll from 3 points on; before that it would morph the shape.
  const canScroll = samples.length > 3;
  const wattsOnTheLine = samples.map((sample) => sample.watts);

  const options: ApexOptions = {
    chart: {
      sparkline: { enabled: true },
      // Each scroll lasts until the next point, so the line keeps moving.
      animations: { enabled: true, dynamicAnimation: { enabled: canScroll, speed: SAMPLE_EVERY_MILLISECONDS } },
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    // A non-solid line fill makes ApexCharts colour the line by the threshold too, not only the area.
    stroke: { width: 2, curve: 'monotoneCubic', fill: { type: 'gradient', opacity: 1 } },
    fill: { type: 'solid', opacity: 0.25 },
    plotOptions: {
      area: { fillTo: 'origin' },
      line: {
        colors: { threshold: 0, colorAboveThreshold: ENERGY_NOW.fromGridColor, colorBelowThreshold: ENERGY_NOW.backToGridColor },
      },
    },
    markers: { size: 0 },
    xaxis: { type: 'numeric', range: REMEMBER_MILLISECONDS },
    // Always include zero, so the zero line is in view, with a little room above and below.
    // (`|| 1`: a line that is exactly 0 W still gets a range.)
    yaxis: { show: false, min: Math.min(0, ...wattsOnTheLine) * 1.1, max: Math.max(0, ...wattsOnTheLine) * 1.1 || 1 },
    annotations: { yaxis: [{ y: 0, borderColor: 'rgba(245, 244, 239, 0.18)', strokeDashArray: 0 }] },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  };

  return (
    <div className="energy-chart" aria-hidden>
      <Chart
        type="area"
        height={CHART_HEIGHT}
        width="100%"
        series={[{ name: 'Net', data: samples.map((sample) => [sample.time, sample.watts]) }]}
        options={options}
      />
    </div>
  );
}

/** "850" for −850 W: the label says which way it goes, so no minus sign. */
const readableWatts = (watts: number) => readableNumber(Math.round(Math.abs(watts)), 0);
