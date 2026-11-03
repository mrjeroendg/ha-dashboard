import { ENERGY_TODAY } from '../../config/energy';
import type { HomeAssistant } from '../../types/hass';

/** Smappee may count in Wh; the tile shows kWh. */
export const kilowattHoursPerSolarUnit = (hass: HomeAssistant) =>
  hass.states[ENERGY_TODAY.solarToday]?.attributes.unit_of_measurement === 'Wh' ? 1 / 1000 : 1;

