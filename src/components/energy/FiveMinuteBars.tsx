import type { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts/core';
// Only the bar chart and annotations (the zero line): the full ApexCharts
// would add ~0.5 MB to the bundle.
import 'apexcharts/bar';
import 'apexcharts/features/annotations';
import { usePeriodicFetch } from '../../hooks/usePeriodicFetch';
import { fetchFiveMinuteAverages } from '../../lib/statistics';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
  entityId: string;
  numberOfBars: number;
  /** The bar's colour, by its value. */
  colorFor: (value: number) => string;
  /** Under the first bar, e.g. "1 uur geleden"; the last one reads "nu". */
  firstBarLabel: string;
}

/** A new 5 minutes is at most a minute late; the page is rarely open longer. */
const REFRESH_BARS_EVERY_MILLISECONDS = 60_000;
const BARS_HEIGHT = 64;

/**
 * The bars under the power on the Energie page (docs/design/energie-nu): the
 * average of each 5 minutes, up to the last 5 minutes that
 * are over, across the full width of the card. Upwards for positive values,
 * downwards for negative ones. Fetched again every minute, without animation.
 */
export function FiveMinuteBars({ hass, entityId, numberOfBars, colorFor, firstBarLabel }: Props) {
  const fiveMinuteValues = usePeriodicFetch(
    () => fetchFiveMinuteAverages(hass, entityId, numberOfBars),
    `${entityId} ${numberOfBars}`,
    REFRESH_BARS_EVERY_MILLISECONDS,
  );
  const values = fiveMinuteValues ?? [];
  const knownValues = values.filter((value) => value !== null);

  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false } },
    plotOptions: { bar: { columnWidth: '62%', borderRadius: 2 } },
    dataLabels: { enabled: false },
    // Always include zero, with a little room above and below (`|| 1`: bars of exactly 0 still get a range).
    yaxis: { show: false, min: Math.min(0, ...knownValues) * 1.1, max: Math.max(0, ...knownValues) * 1.1 || 1 },
    annotations: { yaxis: [{ y: 0, borderColor: 'rgba(245, 244, 239, 0.16)', strokeDashArray: 0 }] },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
  };
  const bars = values.map((value, barNumber) => ({ x: barNumber, y: value, fillColor: colorFor(value ?? 0) }));

  return (
    <div className="energy-card__bars" aria-hidden>
      <Chart type="bar" height={BARS_HEIGHT} width="100%" series={[{ name: 'Per 5 minuten', data: bars }]} options={options} />
      <div className="energy-card__axis">
        <span>{firstBarLabel}</span>
        <span>nu</span>
      </div>
    </div>
  );
}
