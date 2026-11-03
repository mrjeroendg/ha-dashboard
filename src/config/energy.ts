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
  /** Fed back to the grid since midnight. */
  fedBackToGrid: Entity.ELECTRICITY_PRODUCTION_TODAY,
  /** The bar compares today with the average of this many days before it. */
  daysInAverage: 7,
  /**
   * € per kWh, for "≈ € 1,45": what taking from the grid costs, and what
   * feeding back earns. TODO: placeholders, replace with the prices on the bill.
   */
  euroPerKilowattHour: { takenFromGrid: 0.3, fedBackToGrid: 0.04 },
};
