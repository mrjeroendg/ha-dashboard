import type { HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';
import type { HomeAssistant } from '../types/hass';

export interface AircoMode {
  /** HA's `hvac_mode`. */
  mode: string;
  name: string;
  icon: IconName;
}

/** In this order in the sheet (docs/design/airco-sheet). MELCloud calls auto `heat_cool`. */
const AIRCO_MODES: AircoMode[] = [
  { mode: 'heat_cool', name: 'Auto', icon: 'auto' },
  { mode: 'auto', name: 'Auto', icon: 'auto' },
  { mode: 'heat', name: 'Verwarmen', icon: 'sun' },
  { mode: 'cool', name: 'Koelen', icon: 'snowflake' },
  { mode: 'dry', name: 'Drogen', icon: 'droplet' },
  { mode: 'fan_only', name: 'Ventileren', icon: 'fan' },
];

const MODES_WITH_TARGET = ['heat_cool', 'auto', 'heat', 'cool'];

export const readableTemperature = (temperature: number) => temperature.toLocaleString('nl-BE', { maximumFractionDigits: 1 });

/** The modes this airco offers, without "off" (that's the switch). */
export function availableAircoModes(airco: HassEntity): AircoMode[] {
  const modesFromEntity = (airco.attributes.hvac_modes as string[] | undefined) ?? [];

  return AIRCO_MODES.filter((aircoMode) => modesFromEntity.includes(aircoMode.mode));
}

export function aircoModeName(airco: HassEntity): string | undefined {
  return AIRCO_MODES.find((aircoMode) => aircoMode.mode === airco.state)?.name;
}

export function isAircoOn(airco: HassEntity) {
  return airco.state !== 'off';
}

/** A number attribute, or undefined when HA doesn't report it (e.g. no target while drying). */
function numberAttribute(airco: HassEntity, attribute: string): number | undefined {
  const valueFromEntity = airco.attributes[attribute];
  const isNumber = typeof valueFromEntity === 'number' || (typeof valueFromEntity === 'string' && valueFromEntity.trim() !== '');

  return isNumber && !Number.isNaN(Number(valueFromEntity)) ? Number(valueFromEntity) : undefined;
}

export function targetTemperature(airco: HassEntity) {
  return numberAttribute(airco, 'temperature');
}

/** The row's second line: "Verwarmen naar 21°", "Drogen" or "Uit". */
export function aircoDetail(airco: HassEntity): string {
  if (!isAircoOn(airco)) return 'Uit';

  const modeName = aircoModeName(airco) ?? 'Aan';
  const targetTemperatureOfAirco = targetTemperature(airco);
  // Drying and fan only don't heat or cool towards the target.
  const isWorkingTowardsTarget = MODES_WITH_TARGET.includes(airco.state) && targetTemperatureOfAirco !== undefined;

  return isWorkingTowardsTarget ? `${modeName} naar ${readableTemperature(targetTemperatureOfAirco)}°` : modeName;
}

/** "nu 19,5°", under the target in the sheet. */
export function currentTemperatureDetail(airco: HassEntity): string | undefined {
  const currentTemperature = numberAttribute(airco, 'current_temperature');

  return currentTemperature === undefined ? undefined : `nu ${readableTemperature(currentTemperature)}°`;
}

/** − / + in the airco's own step, within its range. */
export function temperatureRange(airco: HassEntity) {
  return {
    step: numberAttribute(airco, 'target_temp_step') ?? 0.5,
    min: numberAttribute(airco, 'min_temp') ?? 16,
    max: numberAttribute(airco, 'max_temp') ?? 31,
  };
}

const aircoTarget = (airco: HassEntity) => ({ entity_id: airco.entity_id });

/** The switch: off from any mode, or back on in its last mode. */
export function toggleAirco(hass: HomeAssistant, airco: HassEntity) {
  const service = isAircoOn(airco) ? 'turn_off' : 'turn_on';

  return hass.callService('climate', service, {}, aircoTarget(airco));
}

/** Choosing something in the sheet while the airco is off turns it on first. */
async function turnOnIfOff(hass: HomeAssistant, airco: HassEntity) {
  if (!isAircoOn(airco)) await hass.callService('climate', 'turn_on', {}, aircoTarget(airco));
}

export async function setTargetTemperature(hass: HomeAssistant, airco: HassEntity, temperature: number) {
  await turnOnIfOff(hass, airco);

  return hass.callService('climate', 'set_temperature', { temperature }, aircoTarget(airco));
}

/** Choosing a mode also turns the airco on. */
export function setAircoMode(hass: HomeAssistant, airco: HassEntity, mode: string) {
  return hass.callService('climate', 'set_hvac_mode', { hvac_mode: mode }, aircoTarget(airco));
}
