import type { ApexOptions } from 'apexcharts';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import Chart from 'react-apexcharts/core';
// Only the bar chart and annotations (the dashed average): the full ApexCharts
// would add ~0.5 MB to the bundle.
import 'apexcharts/bar';
import 'apexcharts/features/annotations';
import { haptic } from '../lib/haptic';
import type { DailyTotal } from '../lib/statistics';
import { Icon, type IconName } from './Icon';
import { LinkChevron } from './LinkChevron';

interface Props {
  name: string;
  icon: IconName;
  /** The icon and the bars. */
  color: string;
  /** The earlier days' bars; by default the tile's colour at 45%. */
  earlierDaysColor?: string;
  /** The icon, when it shouldn't be `color` (e.g. Huis vandaag, whose bars are two colours). */
  iconColor?: string;
  /** Today so far. */
  value: number;
  unit: string;
  decimals: number;
  /** The days before today, oldest first: a bar each, with today's bar last and their average as a dashed line. */
  previousDays?: DailyTotal[];
  /** Shows "≈ € 1,45" next to the value. */
  euros?: number;
  /**
   * Each day's bar in two, stacked: this part at the bottom (e.g. own solar)
   * in its own colours, the rest of the day's total on top in `color`. One
   * value per day of `previousDays`, in the same order, and today's.
   */
  bottomPart?: BottomPart;
  /** Between the value and the chart, e.g. Zon vandaag's split. */
  children?: ReactNode;
  /** A tap on the tile opens more (e.g. its sheet); nothing on the tile shows it. */
  onOpen?(): void;
}

export interface BottomPart {
  color: string;
  earlierDaysColor: string;
  previousDays: number[];
  today: number;
}

const CHART_HEIGHT = 110;
/** The earlier days' bars: the tile's colour at 45% ("73" in hex); today's is the full colour. */
const EARLIER_DAY_OPACITY_HEX = '73';
const TEXT_COLOR = '#f5f4ef';
const MUTED_TEXT_COLOR = '#a6a39b';

/**
 * A day's total so far (docs/design/day-tile, D2): the name with its icon, the
 * value with "≈ €" next to it, and optionally a bar per day for the days
 * before today and today, each with the first letter of its day, and their
 * average as a dashed line. Shared by every tile that shows a total for today.
 */
export function DayTile(props: Props) {
  const { name, icon, color, earlierDaysColor, iconColor, value, unit, decimals, previousDays, euros, bottomPart, children, onOpen } = props;
  const readable = (amount: number) =>
    amount.toLocaleString('nl-BE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const hasChart = previousDays !== undefined && previousDays.length > 0;

  return (
    <div
      className={`day-tile${onOpen ? ' day-tile--opens' : ''}`}
      style={{ '--day-tile-color': iconColor ?? color } as CSSProperties}
      {...(onOpen && {
        role: 'button',
        tabIndex: 0,
        onClick: () => {
          haptic('selection');
          onOpen();
        },
        onKeyDown: (keyboardEvent: KeyboardEvent) => {
          const isOpenKey = keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ';
          if (isOpenKey) onOpen();
        },
      })}
    >
      <p className="day-tile__name">
        <Icon name={icon} />
        {name}
        {onOpen && <LinkChevron />}
      </p>
      <div className="day-tile__values">
        <p className="day-tile__value">
          {readable(value)}
          <small>{unit}</small>
        </p>
        {euros !== undefined && (
          <p className="day-tile__euros">
            <small>≈</small>
            {euros.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' })}
          </p>
        )}
      </div>
      {children}
      {hasChart && (
        <DaysChart
          previousDays={previousDays}
          today={value}
          color={color}
          earlierDaysColor={earlierDaysColor ?? `${color}${EARLIER_DAY_OPACITY_HEX}`}
          bottomPart={bottomPart}
          readable={readable}
        />
      )}
    </div>
  );
}

interface DaysChartProps {
  previousDays: DailyTotal[];
  today: number;
  color: string;
  earlierDaysColor: string;
  bottomPart?: BottomPart;
  readable(amount: number): string;
}

function DaysChart({ previousDays, today, color, earlierDaysColor, bottomPart, readable }: DaysChartProps) {
  const average = previousDays.reduce((sum, previousDay) => sum + previousDay.total, 0) / previousDays.length;
  const dayLetters = [...previousDays.map((previousDay) => dayLetter(new Date(previousDay.dayStart))), dayLetter(new Date())];
  const todayIndex = previousDays.length;
  const totals = [...previousDays.map((previousDay) => previousDay.total), today];
  // Per bar: today's in the full colour. A stacked chart can't be `distributed`, so a function picks the colour per bar.
  const colorPerDay = (todayColor: string, earlierColor: string) => (bar: { dataPointIndex: number }) =>
    bar.dataPointIndex === todayIndex ? todayColor : earlierColor;
  const labelColors = [...previousDays.map(() => MUTED_TEXT_COLOR), TEXT_COLOR];
  const highestDay = Math.max(today, ...previousDays.map((previousDay) => previousDay.total));

  const bottomParts = bottomPart ? [...bottomPart.previousDays, bottomPart.today] : [];
  const series = bottomPart
    ? [
        { name: 'Onderaan', data: bottomParts },
        { name: 'Bovenaan', data: totals.map((total, dayIndex) => Math.max(0, total - bottomParts[dayIndex])) },
      ]
    : [{ name: 'Per dag', data: totals }];

  const options: ApexOptions = {
    chart: {
      stacked: bottomPart !== undefined,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: false },
      parentHeightOffset: 0,
    },
    plotOptions: { bar: { columnWidth: '62%', borderRadius: 2, borderRadiusWhenStacked: 'all' } },
    colors: bottomPart
      ? [colorPerDay(bottomPart.color, bottomPart.earlierDaysColor), colorPerDay(color, earlierDaysColor)]
      : [colorPerDay(color, earlierDaysColor)],
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
    xaxis: {
      categories: dayLetters,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: labelColors, fontSize: '10px' } },
    },
    yaxis: { show: false, min: 0, max: highestDay * 1.15 || 1 },
    annotations: {
      yaxis: [
        {
          y: average,
          borderColor: 'rgba(245, 244, 239, 0.7)',
          strokeDashArray: 3,
          label: {
            text: `gem. ${readable(average)}`,
            position: 'left',
            textAnchor: 'start',
            borderWidth: 0,
            style: { background: '#262624', color: TEXT_COLOR, fontSize: '10px' },
          },
        },
      ],
    },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  };

  return (
    <div className="day-tile__chart" aria-hidden>
      <Chart type="bar" height={CHART_HEIGHT} width="100%" series={series} options={options} />
    </div>
  );
}

/** "D" for dinsdag: the first letter of the day, in Dutch. */
const dayLetter = (day: Date) => day.toLocaleDateString('nl-BE', { weekday: 'narrow' }).toUpperCase();
