import type { IconName } from '../components/Icon';
import { Entity } from './entities';

/**
 * Statistics sections on Thuis, below Snel (docs/design/verbruik), in this
 * order. Each section has an optional live card and any number of tiles.
 * Only the entities listed here count; nothing is found automatically.
 */
export interface StatisticsSectionConfig {
  title: string;
  /** The live card: current power, with today's peak. */
  power?: PowerConfig;
  tiles: StatisticTileConfig[];
}

export interface PowerConfig {
  /** Power sensor in W. A negative value means feeding back into the grid. */
  entity: Entity;
  /** Icon and meter while taking power from the grid. */
  color: string;
  /** Icon and dot while feeding back ("850 W · Terug"). */
  feedingBackColor: string;
}

export interface StatisticTileConfig {
  name: string;
  icon: IconName;
  /** The icon, the line and its fill. */
  color: string;
  /** A daily sensor that resets at midnight: its state is today's value, its statistics the line. */
  entity: Entity;
  /** Digits after the comma, e.g. 2 for "8,13 kWh". */
  decimals: number;
}

/** The approved colours (docs/design/nutsvoorzieningen), validated together in this order. */
const COLORS = {
  stroom: '#d55181',
  zon: '#c98500',
  water: '#3987e5',
  gas: '#199e70',
  feedingBack: '#6bab3e',
};

export const STATISTICS: StatisticsSectionConfig[] = [
  {
    title: 'Verbruik',
    power: { entity: Entity.ELECTRICITY_POWER, color: COLORS.stroom, feedingBackColor: COLORS.feedingBack },
    tiles: [
      { name: 'Stroom', icon: 'bolt', color: COLORS.stroom, entity: Entity.ELECTRICITY_CONSUMPTION_TODAY, decimals: 2 },
      { name: 'Zon', icon: 'sun', color: COLORS.zon, entity: Entity.ELECTRICITY_PRODUCTION_TODAY, decimals: 2 },
      { name: 'Water', icon: 'droplet', color: COLORS.water, entity: Entity.WATER_CONSUMPTION_TODAY, decimals: 3 },
      { name: 'Gas', icon: 'flame', color: COLORS.gas, entity: Entity.GAS_CONSUMPTION_TODAY, decimals: 2 },
    ],
  },
];
