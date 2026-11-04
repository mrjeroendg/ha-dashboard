import type { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts/core';
// Only the bar chart: the full ApexCharts would add ~0.5 MB to the bundle.
import 'apexcharts/bar';

interface SplitPart {
  value: number;
  color: string;
}

interface Props {
  /** Left to right, each as wide as its share of the total. */
  parts: SplitPart[];
}

/** The chart; the bar inside it is 2px lower (the stroke for the gap), so its radius is half of that. */
const CHART_HEIGHT = 12;
const BAR_RADIUS = 4;
/** The thin gap between the parts: a stroke in the colour of the tile behind it. */
const TILE_COLOR = '#30302e';

/**
 * One horizontal bar split into parts, e.g. Zon vandaag's used and injected
 * (docs/design/energie-zon): an ApexCharts stacked bar, like every bar on the
 * dashboard (CLAUDE.md).
 */
export function SplitBar({ parts }: Props) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);

  const options: ApexOptions = {
    chart: { stacked: true, stackType: '100%', sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: true, barHeight: '100%', borderRadius: BAR_RADIUS, borderRadiusApplication: 'around', borderRadiusWhenStacked: 'all' },
    },
    fill: { opacity: 1 },
    colors: parts.map((part) => part.color),
    stroke: { width: 2, colors: [TILE_COLOR] },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
    xaxis: { max: 100 },
  };
  const series = parts.map((part, partIndex) => ({ name: `Deel ${partIndex + 1}`, data: [total > 0 ? part.value : 0] }));

  return (
    <div className="split-bar" aria-hidden>
      <Chart type="bar" height={CHART_HEIGHT} width="100%" series={series} options={options} />
    </div>
  );
}
