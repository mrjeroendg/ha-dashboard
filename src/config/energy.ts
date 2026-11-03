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
