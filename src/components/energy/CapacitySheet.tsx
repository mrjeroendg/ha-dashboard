import type { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts/core';
// Only the bar chart and annotations (the lines): the full ApexCharts would
// add ~0.5 MB to the bundle.
import 'apexcharts/bar';
import 'apexcharts/features/annotations';
import { ENERGY_QUARTER } from '../../config/energy';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchEarlierMonthlyPeaks, fetchWhenValueWasReachedThisMonth, numberState, startOfMonth } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';
import { BottomSheet } from '../BottomSheet';
import { axisOptions, roundAxis } from './InfoSheet';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/** The earlier months don't change, and when the peak was reached only changes with the peak itself; this is plenty. */
const REFRESH_EVERY_MILLISECONDS = 5 * 60_000;
const QUARTER_HOUR = 15 * 60_000;
const CHART_HEIGHT = 160;
/** The earlier months' bars: their colour at 60% ("99" in hex); this month's is the full colour. */
const EARLIER_MONTH_OPACITY_HEX = '99';
const TEXT_COLOR = '#f5f4ef';
const MUTED_TEXT_COLOR = '#a6a39b';
const SHEET_COLOR = '#2b2b29';

interface MonthlyPeakInKilowatts {
  monthStart: number;
  kilowatts: number;
}

/**
 * "Capaciteitstarief" (docs/design/energie-capaciteit): the monthly peaks of
 * the last 12 months, their average (what the bill is based on), this month's
 * peak and what this month costs, worked out. Opened from "Dit kwartier".
 */
export function CapacitySheet({ hass, onClose }: Props) {
  const peakThisMonthWatts = numberState(hass.states, ENERGY_QUARTER.monthPeak);
  const earlierMonthlyPeaks = usePeriodicFetch(
    () => fetchEarlierMonthlyPeaks(hass, ENERGY_QUARTER.monthPeakWithStatistics, ENERGY_QUARTER.monthsInAverage - 1),
    ENERGY_QUARTER.monthPeakWithStatistics,
    REFRESH_EVERY_MILLISECONDS,
  );
  const peakReachedAt = usePeriodicFetch(
    () => fetchWhenValueWasReachedThisMonth(hass, ENERGY_QUARTER.monthPeak),
    `${ENERGY_QUARTER.monthPeak} ${peakThisMonthWatts}`,
    REFRESH_EVERY_MILLISECONDS,
  );
  if (peakThisMonthWatts === undefined) return null;

  const peakWattsPerMonthStart = new Map(
    (earlierMonthlyPeaks ?? []).map((monthlyPeak) => [monthlyPeak.monthStart, monthlyPeak.peakWatts]),
  );
  const earlierMonthlyPeaksInKilowatts: MonthlyPeakInKilowatts[] = Array.from(
    { length: ENERGY_QUARTER.monthsInAverage - 1 },
    (_unused, monthNumber) => {
      const monthStart = startOfMonth(ENERGY_QUARTER.monthsInAverage - 1 - monthNumber).getTime();
      const peakWatts = peakWattsPerMonthStart.get(monthStart) ?? ENERGY_QUARTER.assumedPeakWattsForMissingMonth;
      return { monthStart, kilowatts: peakWatts / 1000 };
    },
  );
  const thisMonthPeak: MonthlyPeakInKilowatts = { monthStart: startOfMonth(0).getTime(), kilowatts: peakThisMonthWatts / 1000 };
  const monthlyPeaks = [...earlierMonthlyPeaksInKilowatts, thisMonthPeak];

  const countedKilowatts = monthlyPeaks.map((monthlyPeak) => Math.max(ENERGY_QUARTER.minimumKilowatts, monthlyPeak.kilowatts));
  const averageKilowatts = countedKilowatts.reduce((sum, kilowatts) => sum + kilowatts, 0) / countedKilowatts.length;
  const euroPerKilowattPerMonth = ENERGY_QUARTER.euroPerKilowattPerYear / 12;
  const costThisMonth = averageKilowatts * euroPerKilowattPerMonth;

  return (
    <BottomSheet label="Capaciteitstarief" className="info-sheet" onClose={onClose}>
      <h2 className="info-sheet__title">Capaciteitstarief</h2>
      <p className="info-sheet__subtitle">Je hoogste kwartier per maand, het laatste jaar.</p>
      <div className="info-sheet__figures">
        <Figure label={`Gemiddelde ${ENERGY_QUARTER.monthsInAverage} maanden`} value={twoDecimals(averageKilowatts)} unit="kW" />
        <Figure label="Je betaalt nu per maand" value={`≈ ${euros(costThisMonth)}`} />
      </div>

      <h3 className="info-sheet__heading">Maandpieken</h3>
      <MonthlyPeaksChart monthlyPeaks={monthlyPeaks} averageKilowatts={averageKilowatts} />

      <h3 className="info-sheet__heading">Deze maand</h3>
      <div className="info-sheet__figures">
        <Figure
          label="Piek tot nu"
          value={twoDecimals(thisMonthPeak.kilowatts)}
          unit="kW"
          detail={peakReachedAt === undefined ? undefined : readableQuarterHour(peakReachedAt)}
        />
        <Figure label="Maand nog" value={String(daysLeftInMonth())} unit={daysLeftInMonth() === 1 ? 'dag' : 'dagen'} />
      </div>

      <h3 className="info-sheet__heading">Wat kost deze maand?</h3>
      <p className="info-sheet__intro">
        Elke maand telt je hoogste kwartier, minstens {twoDecimals(ENERGY_QUARTER.minimumKilowatts)} kW. Je betaalt op het
        gemiddelde van de laatste {ENERGY_QUARTER.monthsInAverage} maanden.
      </p>
      <ul className="info-sheet__calculation">
        <li>
          Gemiddelde van {ENERGY_QUARTER.monthsInAverage} maandpieken
          <strong>{twoDecimals(averageKilowatts)} kW</strong>
        </li>
        <li>
          × tarief ({euros(ENERGY_QUARTER.euroPerKilowattPerYear)} per jaar ÷ 12)
          <strong>{euros(euroPerKilowattPerMonth)} per kW</strong>
        </li>
        <li className="info-sheet__total">
          Deze maand
          <strong>≈ {euros(costThisMonth)}</strong>
        </li>
      </ul>
    </BottomSheet>
  );
}

function Figure({ label, value, unit, detail }: { label: string; value: string; unit?: string; detail?: string }) {
  return (
    <div className="info-figure">
      <p className="info-figure__label">{label}</p>
      <p className="info-figure__value">
        {value}
        {unit && <small>{unit}</small>}
      </p>
      {detail && <p className="info-figure__detail">{detail}</p>}
    </div>
  );
}

/**
 * A bar per month in the colour of the quarter-hour bar (green, orange, red),
 * this month's brightest, with the average as a dashed line. No line for the
 * minimum of 2,50 kW (the owner found it a weird effect).
 */
function MonthlyPeaksChart({
  monthlyPeaks,
  averageKilowatts,
}: {
  monthlyPeaks: MonthlyPeakInKilowatts[];
  averageKilowatts: number;
}) {
  const lastMonthIndex = monthlyPeaks.length - 1;
  const barColors = monthlyPeaks.map((monthlyPeak, monthIndex) => {
    const isThisMonth = monthIndex === lastMonthIndex;
    const colorOfPeak = colorFor(monthlyPeak.kilowatts);
    return isThisMonth ? colorOfPeak : `${colorOfPeak}${EARLIER_MONTH_OPACITY_HEX}`;
  });
  const labelColors = monthlyPeaks.map((_monthlyPeak, monthIndex) =>
    monthIndex === lastMonthIndex ? TEXT_COLOR : MUTED_TEXT_COLOR,
  );
  const highestKilowatts = Math.max(ENERGY_QUARTER.minimumKilowatts, ...monthlyPeaks.map((monthlyPeak) => monthlyPeak.kilowatts));
  // The axis in whole kW, without the unit (the owner's choice); the other numbers in this sheet have two decimals.
  const axis = roundAxis(highestKilowatts * 1.1);

  const options: ApexOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      parentHeightOffset: 0,
    },
    // One colour per bar (distributed), by the height of its peak.
    plotOptions: {
      bar: { columnWidth: '62%', borderRadius: 2, distributed: true },
    },
    colors: barColors,
    dataLabels: { enabled: false },
    legend: { show: false },
    // Faint lines at each step of the y-axis, as in the other sheets (InfoBarChart).
    grid: {
      show: true,
      borderColor: 'rgba(245, 244, 239, 0.08)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      // Room between the y-axis's numbers and the first bar, so they don't stick to the chart.
      padding: { top: -14, right: 0, bottom: 0, left: 20 },
    },
    xaxis: {
      categories: monthlyPeaks.map((monthlyPeak) => monthName(monthlyPeak.monthStart)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: labelColors, fontSize: '10px' } },
    },
    yaxis: axisOptions(axis),
    annotations: {
      yaxis: [
        {
          y: averageKilowatts,
          borderColor: 'rgba(245, 244, 239, 0.8)',
          strokeDashArray: 3,
          label: {
            text: `gem. ${twoDecimals(averageKilowatts)} kW`,
            position: 'left',
            textAnchor: 'start',
            borderWidth: 0,
            style: {
              background: SHEET_COLOR,
              color: TEXT_COLOR,
              fontSize: '10px',
            },
          },
        },
      ],
    },
    tooltip: { enabled: false },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } },
    },
  };

  return (
    <div className="info-sheet__chart" aria-hidden>
      <Chart
        type="bar"
        height={CHART_HEIGHT}
        width="100%"
        series={[
          {
            name: 'Maandpiek',
            data: monthlyPeaks.map((monthlyPeak) => monthlyPeak.kilowatts),
          },
        ]}
        options={options}
      />
    </div>
  );
}

/** The quarter-hour bar's colour band a peak falls in: green up to 3 kW, orange up to 5, then red. */
function colorFor(kilowatts: number): string {
  const colorStops = ENERGY_QUARTER.colorStops;
  const colorStopReached = colorStops.find((colorStop) => kilowatts <= colorStop.kilowatts);
  return (colorStopReached ?? colorStops[colorStops.length - 1]).color;
}

function daysLeftInMonth() {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  // Today counts: on the last day there is 1 day left.
  return daysInMonth - today.getDate() + 1;
}

/** "do 14 nov, 18:15–18:30": the quarter-hour the peak was reached in. */
function readableQuarterHour(peakReachedAt: number) {
  const quarterStart = new Date(Math.floor(peakReachedAt / QUARTER_HOUR) * QUARTER_HOUR);
  const quarterEnd = new Date(quarterStart.getTime() + QUARTER_HOUR);
  const weekday = quarterStart.toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '');
  const time = (moment: Date) => moment.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

  return `${weekday} ${quarterStart.getDate()} ${monthName(quarterStart.getTime())}, ${time(quarterStart)}–${time(quarterEnd)}`;
}

/** "nov": the month's short name in Dutch, without the full stop. */
const monthName = (moment: number) => new Date(moment).toLocaleDateString('nl-BE', { month: 'short' }).replace('.', '');

const twoDecimals = (value: number) =>
  value.toLocaleString('nl-BE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const euros = (value: number) => value.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' });
