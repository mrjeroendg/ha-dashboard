import type { ApexOptions } from 'apexcharts';
import type { ReactNode } from 'react';
import Chart from 'react-apexcharts/core';
// Only the bar chart and annotations (the average): the full ApexCharts would
// add ~0.5 MB to the bundle.
import 'apexcharts/bar';
import 'apexcharts/features/annotations';
import { BottomSheet } from '../BottomSheet';

/**
 * The shared parts of the sheets behind Energie's tiles
 * (docs/design/energie-sheets): a sheet with a title and a line under it,
 * sections with a small heading, figures two by two, a bar chart and a
 * paragraph. Styles under "Info sheets" in styles.css.
 */
export function InfoSheet({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose(): void; children: ReactNode }) {
  return (
    <BottomSheet label={title} className="info-sheet" onClose={onClose}>
      <h2 className="info-sheet__title">{title}</h2>
      <p className="info-sheet__subtitle">{subtitle}</p>
      {children}
    </BottomSheet>
  );
}

export function InfoSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="info-sheet__heading">{heading}</h3>
      {children}
    </section>
  );
}

export function InfoFigures({ children }: { children: ReactNode }) {
  return <div className="info-sheet__figures">{children}</div>;
}

export function InfoFigure({ label, value, unit, detail }: { label: string; value: string; unit?: string; detail?: string }) {
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

export function InfoText({ children }: { children: ReactNode }) {
  return <p className="info-sheet__text">{children}</p>;
}

interface InfoBarChartProps {
  /** One per bar; an empty one shows no label (e.g. only every 6 hours). */
  labels: string[];
  /** `null` is a bar without a value yet (e.g. an hour still to come). */
  values: Array<number | null>;
  /** The bar for now; the others are this colour at 45%. */
  color: string;
  /** Which bar is now; by default the last. */
  nowIndex?: number;
  /** A dashed line with its label, e.g. "gem. 9,59". */
  average?: { value: number; label: string };
  /** On the y-axis's labels, e.g. "kWh". */
  unit: string;
}

const CHART_HEIGHT = 150;
const AXIS_LINE_COLOR = 'rgba(245, 244, 239, 0.08)';
/** About this many steps on the y-axis, each a round number. */
const AXIS_STEPS = 4;
const EARLIER_BAR_OPACITY_HEX = '73';
const TEXT_COLOR = '#f5f4ef';
const MUTED_TEXT_COLOR = '#a6a39b';
const SHEET_COLOR = '#2b2b29';

/** A bar per hour, day or month, the one for now in the full colour and its label white. */
export function InfoBarChart({ labels, values, color, nowIndex = values.length - 1, average, unit }: InfoBarChartProps) {
  const barColors = values.map((_value, barIndex) => (barIndex === nowIndex ? color : `${color}${EARLIER_BAR_OPACITY_HEX}`));
  const labelColors = labels.map((_label, barIndex) => (barIndex === nowIndex ? TEXT_COLOR : MUTED_TEXT_COLOR));
  const knownValues = values.filter((value) => value !== null);
  const highestValue = Math.max(0, ...knownValues, average?.value ?? 0);
  const axis = roundAxis(highestValue);

  const options: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, parentHeightOffset: 0 },
    // One colour per bar (distributed), so the last can be brighter than the rest.
    plotOptions: { bar: { columnWidth: '62%', borderRadius: 2, distributed: true } },
    colors: barColors,
    dataLabels: { enabled: false },
    legend: { show: false },
    // Faint lines at each step of the y-axis, nothing upright. ApexCharts keeps
    // 30px free above the plot; part of it goes, the top label still fits.
    grid: {
      show: true,
      borderColor: AXIS_LINE_COLOR,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: -14, right: 0, bottom: 0, left: 0 },
    },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: false, style: { colors: labelColors, fontSize: '10px' } },
    },
    yaxis: axisOptions(axis, unit),
    annotations: {
      yaxis: average
        ? [
            {
              y: average.value,
              borderColor: 'rgba(245, 244, 239, 0.7)',
              strokeDashArray: 3,
              label: {
                text: average.label,
                position: 'left',
                textAnchor: 'start',
                borderWidth: 0,
                style: { background: SHEET_COLOR, color: TEXT_COLOR, fontSize: '10px' },
              },
            },
          ]
        : [],
    },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  };

  return (
    <div className="info-sheet__chart" aria-hidden>
      <Chart type="bar" height={CHART_HEIGHT} width="100%" series={[{ name: 'Per periode', data: values }]} options={options} />
    </div>
  );
}

export interface RoundAxis {
  max: number;
  steps: number;
  decimals: number;
}

/**
 * A y-axis from 0 to just above `highestValue`, in about 4 round steps (1, 2,
 * 2,5 or 5 times a power of ten), with as many decimals as the step needs.
 */
export function roundAxis(highestValue: number, decimals?: number): RoundAxis {
  const roughStep = (highestValue || 1) / AXIS_STEPS;
  const powerOfTen = 10 ** Math.floor(Math.log10(roughStep));
  const roundStep = [1, 2, 2.5, 5, 10].map((factor) => factor * powerOfTen).find((step) => step >= roughStep) ?? 10 * powerOfTen;
  const steps = Math.ceil((highestValue || 1) / roundStep);
  const decimalsOfStep = Math.max(0, -Math.floor(Math.log10(roundStep) + 1e-9) + (roundStep / powerOfTen === 2.5 ? 1 : 0));

  return { max: steps * roundStep, steps, decimals: decimals ?? decimalsOfStep };
}

/** ApexCharts' y-axis for a round axis: muted labels like "2,5 kWh" on the left. */
export function axisOptions(axis: RoundAxis, unit: string): ApexOptions['yaxis'] {
  return {
    show: true,
    min: 0,
    max: axis.max,
    tickAmount: axis.steps,
    labels: {
      // Room for "400 kWh", and a little away from the plot, so the average's
      // label (on the left of the plot) doesn't cover its end.
      minWidth: 52,
      offsetX: -6,
      style: { colors: MUTED_TEXT_COLOR, fontSize: '10px' },
      formatter: (value: number) => `${readableAmount(value, axis.decimals)} ${unit}`,
    },
  };
}

/** "nov": a month's short name in Dutch, without the full stop. */
export const monthName = (moment: number) => new Date(moment).toLocaleDateString('nl-BE', { month: 'short' }).replace('.', '');

/** "0u", "6u", "12u", "18u" under every 6th hour, nothing under the others. */
export const hourLabels = () => Array.from({ length: 24 }, (_unused, hour) => (hour % 6 === 0 ? `${hour}u` : ''));

export const readableAmount = (value: number, decimals: number) =>
  value.toLocaleString('nl-BE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const readableEuros = (value: number) => value.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' });

/** "di 28 okt": a day, short. */
export const readableDay = (moment: number) => {
  const day = new Date(moment);
  const weekday = day.toLocaleDateString('nl-BE', { weekday: 'short' }).replace('.', '');
  return `${weekday} ${day.getDate()} ${monthName(moment)}`;
};
