import type { ApexOptions } from 'apexcharts';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Chart from 'react-apexcharts/core';
// Only the area chart: the full ApexCharts would add ~0.5 MB to the bundle.
import 'apexcharts/area';
import { ENERGY_NOW } from '../../config/energy';
import { useEasedNumber } from '../../hooks/useEasedNumber';
import { REMEMBER_MILLISECONDS, SAMPLE_EVERY_MILLISECONDS, useLivePowerSamples, type PowerSample } from '../../hooks/useLivePowerSamples';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { numberState, readableNumber } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
}

/** "Nu" sits at 70% of the card's width; the line to its left is the last 30 s. */
const NOW_AT_SHARE_OF_WIDTH = 0.7;
const WINDOW_MILLISECONDS = REMEMBER_MILLISECONDS / NOW_AT_SHARE_OF_WIDTH;
/** How often the line slides on: 20 times a second is smooth at its ~7 px per second. */
const SLIDE_EVERY_MILLISECONDS = 50;
const CHART_HEIGHT = 130;
/** The smallest range the chart shows, so a steady 150 W isn't drawn as a mountain. */
const SMALLEST_RANGE_WATTS = 300;
/** As in the Verbruik tiles: ApexCharts applies a gradient's opacity twice, so it gets the square root. */
const FILL_OPACITY_AWAY_FROM_ZERO = 0.38 ** 0.5;
const FILL_OPACITY_AT_ZERO = 0.06 ** 0.5;

/**
 * "Nu" on the Energie page (docs/design/energie-nu, option B, first step): what
 * goes through the P1 meter right now, as a number that counts to each new
 * value, and a live line that starts when the page opens.
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
      <LivePowerLine currentWatts={currentWatts} shownWatts={shownWatts} isMotionReduced={isMotionReduced} />
    </div>
  );
}

interface LivePowerLineProps {
  currentWatts: number;
  /** The end of the line: the current power, easing to each new value like the big number. */
  shownWatts: number;
  isMotionReduced: boolean;
}

/**
 * The line of the last 30 s: it grows from the left edge until "nu" reaches
 * 70%, then slides left; pink above zero, green below. The zero line, the dot,
 * its pulse and the value next to it are HTML on top: ApexCharts' sparkline
 * mode leaves out annotations, and the pulse keeps running while it redraws.
 */
function LivePowerLine({ currentWatts, shownWatts, isMotionReduced }: LivePowerLineProps) {
  const samples = useLivePowerSamples(currentWatts);
  const [openedAt] = useState(() => Date.now());
  const now = useSlidingClock(isMotionReduced ? SAMPLE_EVERY_MILLISECONDS : SLIDE_EVERY_MILLISECONDS);

  const isFull = now - openedAt >= REMEMBER_MILLISECONDS;
  const windowStart = Math.max(openedAt, now - REMEMBER_MILLISECONDS);
  const nowShareOfWidth = (now - windowStart) / WINDOW_MILLISECONDS;
  const lineWithNow = [...samples, { time: now, watts: shownWatts }];
  const powerRange = useEasedRange(lineWithNow.map((sample) => sample.watts));
  const shareOfHeightFor = (watts: number) => (powerRange.top - watts) / (powerRange.top - powerRange.bottom);
  const { fromGrid, backToGrid } = splitAtZero(lineWithNow);

  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { width: 2, curve: 'monotoneCubic', lineCap: 'round' },
    colors: [ENERGY_NOW.fromGridColor, ENERGY_NOW.backToGridColor],
    // Strongest away from the zero line, fading towards it: top to bottom for pink,
    // the other way round for green, which lies below zero.
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shade: 'light',
        shadeIntensity: 0,
        opacityFrom: [FILL_OPACITY_AWAY_FROM_ZERO, FILL_OPACITY_AT_ZERO],
        opacityTo: [FILL_OPACITY_AT_ZERO, FILL_OPACITY_AWAY_FROM_ZERO],
        stops: [0, 100],
      },
    },
    xaxis: { type: 'numeric', min: windowStart, max: windowStart + WINDOW_MILLISECONDS },
    yaxis: { show: false, labels: { show: false }, min: powerRange.bottom, max: powerRange.top },
    tooltip: { enabled: false },
    legend: { show: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  };

  const nowPosition = { left: `${nowShareOfWidth * 100}%`, top: `${shareOfHeightFor(shownWatts) * 100}%` };

  return (
    <>
      <div className="energy-chart" aria-hidden>
        <Chart
          type="area"
          height={CHART_HEIGHT}
          width="100%"
          series={[
            { name: 'Van het net', data: fromGrid },
            { name: 'Terug naar het net', data: backToGrid },
          ]}
          options={options}
        />
        <span className="energy-chart__zero" style={{ top: `${shareOfHeightFor(0) * 100}%` }} />
        <span className={`energy-chart__pulse${isMotionReduced ? '' : ' is-pulsing'}`} style={nowPosition} />
        <span className="energy-chart__dot" style={nowPosition} />
        <span className="energy-chart__value" style={nowPosition}>
          {readableWatts(shownWatts)} W
        </span>
      </div>
      <div className="energy-chart__axis" aria-hidden>
        {isFull && <span>30 s geleden</span>}
        <span className="energy-chart__now" style={{ left: nowPosition.left }}>
          nu
        </span>
      </div>
    </>
  );
}

/** "850" for −850 W: the label says which way it goes, so no minus sign. */
const readableWatts = (watts: number) => readableNumber(Math.round(Math.abs(watts)), 0);

/** The current time, renewed every `everyMilliseconds`, for the line to slide on. */
function useSlidingClock(everyMilliseconds: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const slideTimer = window.setInterval(() => setNow(Date.now()), everyMilliseconds);
    return () => window.clearInterval(slideTimer);
  }, [everyMilliseconds]);

  return now;
}

/**
 * The chart's range: from below the lowest to above the highest value, always
 * including zero, so the zero line drops to the bottom while only taking from
 * the grid. It eases to a new range instead of jumping when a peak comes in or
 * drops off.
 */
function useEasedRange(wattsOnTheLine: number[]): { top: number; bottom: number } {
  const highestWatts = Math.max(0, ...wattsOnTheLine);
  const lowestWatts = Math.min(0, ...wattsOnTheLine);
  const rangeWatts = Math.max(highestWatts - lowestWatts, SMALLEST_RANGE_WATTS);
  const targetTop = highestWatts + rangeWatts * 0.15;
  const targetBottom = lowestWatts < 0 ? lowestWatts - rangeWatts * 0.15 : 0;

  const easedRange = useRef({ top: targetTop, bottom: targetBottom });
  easedRange.current = {
    top: easedRange.current.top + (targetTop - easedRange.current.top) * 0.15,
    bottom: easedRange.current.bottom + (targetBottom - easedRange.current.bottom) * 0.15,
  };

  return easedRange.current;
}

type ChartPoint = [number, number | null];

/**
 * The line as two series: taking from the grid (zero and up) and feeding back
 * (zero and down). Where the line crosses zero, both get a point exactly at
 * zero, so pink and green meet on the zero line; elsewhere the other series
 * has a gap.
 */
function splitAtZero(samples: PowerSample[]): { fromGrid: ChartPoint[]; backToGrid: ChartPoint[] } {
  const fromGrid: ChartPoint[] = [];
  const backToGrid: ChartPoint[] = [];

  samples.forEach((sample, sampleNumber) => {
    const previousSample = samples[sampleNumber - 1];
    const crossesZero = previousSample !== undefined && previousSample.watts * sample.watts < 0;
    if (crossesZero) {
      const shareUntilZero = previousSample.watts / (previousSample.watts - sample.watts);
      const zeroTime = previousSample.time + (sample.time - previousSample.time) * shareUntilZero;
      fromGrid.push([zeroTime, 0]);
      backToGrid.push([zeroTime, 0]);
    }

    fromGrid.push([sample.time, sample.watts >= 0 ? sample.watts : null]);
    backToGrid.push([sample.time, sample.watts <= 0 ? sample.watts : null]);
  });

  return { fromGrid, backToGrid };
}
