import { Entity } from './entities';
import { UTILITY_COLORS } from './statistics';

/** "Nu" on the Energie page (docs/design/energie-nu). */
export const ENERGY_NOW = {
  /** The P1 meter, in W: positive while taking from the grid, negative while feeding back. */
  gridPower: Entity.ELECTRICITY_POWER,
  /** "Van het net": the line, fill and dot above zero. */
  fromGridColor: UTILITY_COLORS.stroom,
  /** "Terug naar het net": below zero. */
  backToGridColor: UTILITY_COLORS.feedingBack,
  /** The bars below the number: the last hour. */
  fiveMinuteBars: 12,
};

/**
 * "Dit kwartier" on the Energie page (docs/design/energie-kwartier): the
 * capaciteitstarief, from the P1 meter's own figures, in W.
 */
export const ENERGY_QUARTER = {
  /** The running average of the current quarter-hour. */
  averageDemand: Entity.ELECTRICITY_AVERAGE_DEMAND_THIS_QUARTER,
  /** The highest quarter-hour this month; resets on the 1st. */
  monthPeak: Entity.ELECTRICITY_PEAK_DEMAND_THIS_MONTH,
  /**
   * The colours by kW, blending from one to the next: fully green up to 3 kW,
   * orange at 5, dark red from 7. So 4 and 6 kW, the borders of good, watch
   * out and too high, sit halfway through each blend.
   */
  colorStops: [
    { kilowatts: 3, color: '#6bab3e' },
    { kilowatts: 5, color: '#e8913a' },
    { kilowatts: 7, color: '#b42318' },
  ],
  /** The marks under the bar, at the borders. */
  marksAtKilowatts: [4, 6],
};

/** "Vandaag tot nu" on the Energie page (docs/design/energie-vandaag): the P1 meter's daily sensors, in kWh. */
export const ENERGY_TODAY = {
  /** Taken from the grid since midnight. */
  takenFromGrid: Entity.ELECTRICITY_CONSUMPTION_TODAY,
  /** Fed back to the grid since midnight: the part of the solar that the house didn't use. */
  fedBackToGrid: Entity.ELECTRICITY_PRODUCTION_TODAY,
  /** What the solar panels made since midnight (Smappee), in kWh or Wh (its unit says which). */
  solarToday: Entity.SOLAR_PRODUCTION_TODAY,
  /** "Zon vandaag" (docs/design/energie-zon): yellow, and a darker yellow for the earlier days (45% of it looks olive). */
  solarColor: '#f2c230',
  solarEarlierDaysColor: '#a8902f',
  /** The solar that went back to the grid, in Zon vandaag's split: red, because it's worth little. */
  solarFedBackColor: '#e05252',
  /** The chart shows this many days before today, plus today; the dashed line is their average. */
  previousDays: 13,
  /**
   * € per kWh, for Afgenomen's "≈ € 1,45". The contract is dynamic (Eneco),
   * so this is a fixed approximation: the higher price, all-in. Live prices
   * are on the to-do list (docs/TODO.md).
   */
  euroPerKilowattHour: { takenFromGrid: 0.35 },
};

/** The "Gas" chip on the Energie page (docs/design/energie-gas): the gas meter's daily sensor, in m³. */
export const ENERGY_GAS = {
  gasToday: Entity.GAS_CONSUMPTION_TODAY,
  /** Light blue, like a gas flame; Thuis' gas tile keeps its own colour for now. */
  color: '#5cb8f2',
  /** The chart shows this many days before today, plus today. */
  previousDays: 13,
  /**
   * € per m³, for "≈ € 2,39": an estimate on the high side (all-in about
   * €0,12 per kWh × about 10,8 kWh per m³) until it's replaced by the price on
   * the bill.
   */
  euroPerCubicMetre: 1.3,
};

/** The "Water" chip on the Energie page (docs/design/energie-water): the water meter. */
export const ENERGY_WATER = {
  /** The flow right now, in l/min. */
  usageNow: Entity.WATER_USAGE,
  /** Since midnight, in m³; also the source of the 5-minute bars (its change per 5 minutes). */
  consumptionToday: Entity.WATER_CONSUMPTION_TODAY,
  color: UTILITY_COLORS.water,
  /** The bars below the number: the last 2 hours. */
  fiveMinuteBars: 24,
  /** The chart shows this many days before today, plus today. */
  previousDays: 13,
  /**
   * € per m³, for "≈ € 0,60": an estimate on the high side (Flemish water,
   * all-in with the sanitation charges) until it's replaced by the price on
   * the bill.
   */
  euroPerCubicMetre: 5.9,
};
