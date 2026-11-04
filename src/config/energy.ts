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
  /** The sheet (docs/design/energie-capaciteit): the bill takes the average of this many monthly peaks. */
  monthsInAverage: 12,
  /**
   * A copy of `monthPeak` with a state class (a template helper in HA), so HA
   * keeps its statistics forever: the earlier months' peaks come from it.
   */
  monthPeakWithStatistics: Entity.ELECTRICITY_PEAK_DEMAND_THIS_MONTH_WITH_STATISTICS,
  /** A month without statistics (e.g. before the copy existed), in W. */
  assumedPeakWattsForMissingMonth: 3500,
  /** Every monthly peak counts as at least this much. */
  minimumKilowatts: 2.5,
  /** Fluvius Imewo (around Gent), 2026, per kW of the average per year; billed per month (÷ 12). */
  euroPerKilowattPerYear: 57.45,
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
  /**
   * The sluipverbruik in the Afgenomen sheet (docs/design/energie-sheets), from
   * Smappee: the lowest power of the last 2 days in W, and what that has used
   * since midnight (Wh or kWh, its unit says which).
   */
  alwaysOnPower: Entity.ELECTRICITY_ALWAYS_ON_POWER,
  alwaysOnToday: Entity.ELECTRICITY_ALWAYS_ON_TODAY,
  /** "Huis vandaag" (docs/design/energie-huis): teal for its icon, apart from net (pink), zon (yellow) and gas (purple); the bars are net and zon. */
  houseColor: '#3fb6a8',
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
  /** Purple, like Thuis' gas tile (the owner's choice). */
  color: UTILITY_COLORS.gas,
  /** The chart shows this many days before today, plus today. */
  previousDays: 13,
  /**
   * € per m³, for "≈ € 2,39": an estimate on the high side (all-in about
   * €0,12 per kWh × about 10,8 kWh per m³) until it's replaced by the price on
   * the bill.
   */
  euroPerCubicMetre: 1.3,
};
