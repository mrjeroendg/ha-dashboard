import type { CSSProperties } from 'react';
import Chart from 'react-apexcharts/core';
// Only the area chart: the full ApexCharts would add ~0.5 MB to the bundle.
import 'apexcharts/area';
import type { ApexOptions } from 'apexcharts';
import type { PowerConfig, StatisticsSectionConfig, StatisticTileConfig } from '../config/statistics';
import { usePeriodicFetch } from '../hooks/usePeriodicFetch';
import { fetchDailyTotals, fetchPeakToday, numberState, readableNumber } from '../lib/statistics';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
  section: StatisticsSectionConfig;
}

/** HA's statistics change at most every 5 minutes; this is plenty for a day's peak and a week's line. */
const REFRESH_STATISTICS_EVERY_MILLISECONDS = 5 * 60_000;
const SPARKLINE_HEIGHT = 46;
/** The fill under the line, as approved. ApexCharts applies its opacity twice (in the colour and as stop-opacity), so it gets the square root. */
const VISIBLE_OPACITY_AT_TOP = 0.38;
const VISIBLE_OPACITY_AT_BOTTOM = 0.06;

/**
 * A statistics section on Thuis (docs/design/verbruik): an optional live card
 * with the current power, then a tile per configured sensor with today's value
 * and a line of the last 7 days. Read-only.
 */
export function StatisticsSection({ hass, section }: Props) {
  const tileEntityIds = section.tiles.map((tile) => tile.entity);
  const dailyTotalsPerEntity = usePeriodicFetch(
    () => fetchDailyTotals(hass, tileEntityIds),
    tileEntityIds.join(','),
    REFRESH_STATISTICS_EVERY_MILLISECONDS,
  );

  return (
    <section className="statistics">
      <h2 className="section-title">{section.title}</h2>
      {section.power && <PowerCard hass={hass} power={section.power} />}
      <div className="statistics__tiles">
        {section.tiles.map((tile) => (
          <StatisticTile key={tile.entity} hass={hass} tile={tile} previousDays={dailyTotalsPerEntity?.[tile.entity] ?? []} />
        ))}
      </div>
    </section>
  );
}

/** "196 W · Nu" with today's peak, or "850 W · Terug" in green while feeding back. */
function PowerCard({ hass, power }: { hass: HomeAssistant; power: PowerConfig }) {
  const peakFromStatistics = usePeriodicFetch(() => fetchPeakToday(hass, power.entity), power.entity, REFRESH_STATISTICS_EVERY_MILLISECONDS);
  const currentPower = numberState(hass.states, power.entity);
  if (currentPower === undefined) return null;

  const isFeedingBack = currentPower < 0;
  const cardColor = isFeedingBack ? power.feedingBackColor : power.color;
  // HA's statistics lag a few minutes behind, so the power right now can be the new peak.
  const peakToday = Math.max(peakFromStatistics ?? 0, currentPower);
  const shareOfPeak = peakToday > 0 ? Math.min(1, Math.max(0, currentPower / peakToday)) : 0;

  return (
    <div className="power-card" style={{ '--statistic-color': cardColor } as CSSProperties}>
      <span className="power-card__icon">
        <Icon name="bolt" />
      </span>
      <div>
        {/* No minus sign while feeding back: "Terug" says which way it goes. */}
        <b className="power-card__value">
          {readableNumber(Math.abs(currentPower), 0)}
          <small>W</small>
        </b>
        <span className="power-card__now">{isFeedingBack ? 'Terug' : 'Nu'}</span>
      </div>
      {!isFeedingBack && peakToday > 0 && (
        <div className="power-card__peak">
          <span className="power-card__peak-label">
            Piek vandaag <b>{readableNumber(peakToday / 1000, 1)} kW</b>
          </span>
          <span className="power-card__meter">
            <i style={{ width: `${shareOfPeak * 100}%` }} />
          </span>
        </div>
      )}
    </div>
  );
}

interface StatisticTileProps {
  hass: HomeAssistant;
  tile: StatisticTileConfig;
  /** The totals of the days before today, oldest first. */
  previousDays: number[];
}

function StatisticTile({ hass, tile, previousDays }: StatisticTileProps) {
  const today = numberState(hass.states, tile.entity);
  const unit = String(hass.states[tile.entity]?.attributes.unit_of_measurement ?? '');
  const lastSevenDays = today === undefined ? previousDays : [...previousDays, today];

  return (
    <div className="statistic-tile" style={{ '--statistic-color': tile.color } as CSSProperties}>
      <div className="statistic-tile__header">
        <Icon name={tile.icon} />
        {tile.name}
      </div>
      <b className="statistic-tile__value">
        {today === undefined ? '–' : readableNumber(today, tile.decimals)}
        {today !== undefined && unit && <small>{unit}</small>}
      </b>
      <Sparkline values={lastSevenDays} color={tile.color} name={tile.name} />
    </div>
  );
}

/** The line at the bottom of a tile, full bleed: no axes, no tooltips, no animation. */
function Sparkline({ values, color, name }: { values: number[]; color: string; name: string }) {
  const hasEnoughPointsForALine = values.length >= 2;
  if (!hasEnoughPointsForALine) return <div className="statistic-tile__sparkline" aria-hidden />;

  const options: ApexOptions = {
    chart: { sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { width: 2, curve: 'smooth', lineCap: 'round' },
    colors: [color],
    // The line's own colour from 38% to 6%, without ApexCharts' default dark shade.
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shade: 'light',
        shadeIntensity: 0,
        gradientToColors: [color],
        opacityFrom: VISIBLE_OPACITY_AT_TOP ** 0.5,
        opacityTo: VISIBLE_OPACITY_AT_BOTTOM ** 0.5,
        stops: [0, 100],
      },
    },
    tooltip: { enabled: false },
    states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } },
    // A little room above the highest day, so the line isn't cut off at the top.
    yaxis: { min: 0, max: Math.max(...values) * 1.15 || 1 },
  };

  return (
    <div className="statistic-tile__sparkline" aria-hidden>
      <Chart type="area" height={SPARKLINE_HEIGHT} width="100%" series={[{ name, data: values }]} options={options} />
    </div>
  );
}
