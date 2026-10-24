import type { HassEntity } from 'home-assistant-js-websocket';
import type { ChoiceOption } from '../components/ChoiceRow';
import type { IconName } from '../components/Icon';
import type { HomeAssistant } from '../types/hass';

/** One icon in a row of the airco sheet. */
type AircoOption = ChoiceOption & { icon: IconName };

/** In this order in the sheet (docs/design/airco-sheet). MELCloud calls auto `heat_cool`. */
const AIRCO_MODES: AircoOption[] = [
  { value: 'heat_cool', name: 'Auto', icon: 'auto' },
  { value: 'auto', name: 'Auto', icon: 'auto' },
  { value: 'heat', name: 'Verwarmen', icon: 'sun' },
  { value: 'cool', name: 'Koelen', icon: 'snowflake' },
  { value: 'dry', name: 'Drogen', icon: 'droplet' },
  { value: 'fan_only', name: 'Ventileren', icon: 'fan' },
];

const FAN_SPEEDS: AircoOption[] = [
  { value: 'auto', name: 'Auto', icon: 'auto' },
  { value: 'speed_1', name: 'Snelheid 1', icon: 'fanSpeed1' },
  { value: 'speed_2', name: 'Snelheid 2', icon: 'fanSpeed2' },
  { value: 'speed_3', name: 'Snelheid 3', icon: 'fanSpeed3' },
  { value: 'speed_4', name: 'Snelheid 4', icon: 'fanSpeed4' },
  { value: 'speed_5', name: 'Snelheid 5', icon: 'fanSpeed5' },
];

/** `swing_modes`: position 1 blows straight out, 5 straight down. */
const UP_DOWN_POSITIONS: AircoOption[] = [
  { value: 'auto', name: 'Auto', icon: 'auto' },
  { value: 'position_1', name: 'Stand 1', icon: 'vaneUpDown1' },
  { value: 'position_2', name: 'Stand 2', icon: 'vaneUpDown2' },
  { value: 'position_3', name: 'Stand 3', icon: 'vaneUpDown3' },
  { value: 'position_4', name: 'Stand 4', icon: 'vaneUpDown4' },
  { value: 'position_5', name: 'Stand 5', icon: 'vaneUpDown5' },
  { value: 'swing', name: 'Swing', icon: 'vaneUpDownSwing' },
];

/** `swing_horizontal_modes`, from far left to far right. */
const LEFT_RIGHT_POSITIONS: AircoOption[] = [
  { value: 'auto', name: 'Auto', icon: 'auto' },
  { value: 'left', name: 'Links', icon: 'vaneLeftRight1' },
  { value: 'left_centre', name: 'Links-midden', icon: 'vaneLeftRight2' },
  { value: 'centre', name: 'Midden', icon: 'vaneLeftRight3' },
  { value: 'right_centre', name: 'Rechts-midden', icon: 'vaneLeftRight4' },
  { value: 'right', name: 'Rechts', icon: 'vaneLeftRight5' },
  { value: 'swing', name: 'Swing', icon: 'vaneLeftRightSwing' },
];

const MODES_WITH_TARGET = ['heat_cool', 'auto', 'heat', 'cool'];

export const readableTemperature = (temperature: number) => temperature.toLocaleString('nl-BE', { maximumFractionDigits: 1 });

export function aircoModeName(airco: HassEntity): string | undefined {
  return AIRCO_MODES.find((aircoMode) => aircoMode.value === airco.state)?.name;
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

/** A row of icons in the sheet: which options the airco offers, which one it's on, and how to change it. */
export interface AircoSetting {
  title: string;
  options: AircoOption[];
  chosenValue?: string;
  choose(hass: HomeAssistant, value: string): Promise<unknown>;
  /** The mode row has slightly taller buttons. */
  hasTallerButtons?: boolean;
}

/** The options HA lists for this airco, in the design's order (not HA's); values without an icon are left out. */
function offeredOptions(airco: HassEntity, listAttribute: string, knownOptions: AircoOption[]): AircoOption[] {
  const valuesFromEntity = (airco.attributes[listAttribute] as string[] | undefined) ?? [];

  return knownOptions.filter((knownOption) => valuesFromEntity.includes(knownOption.value));
}

/**
 * The four rows of the sheet, top to bottom. A row with no options is hidden.
 * Choosing anything while the airco is off turns it on (a mode does that by itself).
 */
export function aircoSettings(airco: HassEntity): AircoSetting[] {
  const target = aircoTarget(airco);
  const currentValue = (attribute: string) => airco.attributes[attribute] as string | undefined;

  return [
    {
      title: 'Modus',
      // "off" isn't one of them: that's the switch.
      options: offeredOptions(airco, 'hvac_modes', AIRCO_MODES),
      chosenValue: airco.state,
      choose: (hass, chosenMode) => hass.callService('climate', 'set_hvac_mode', { hvac_mode: chosenMode }, target),
      hasTallerButtons: true,
    },
    {
      title: 'Ventilator',
      options: offeredOptions(airco, 'fan_modes', FAN_SPEEDS),
      chosenValue: currentValue('fan_mode'),
      choose: async (hass, chosenSpeed) => {
        await turnOnIfOff(hass, airco);
        return hass.callService('climate', 'set_fan_mode', { fan_mode: chosenSpeed }, target);
      },
    },
    {
      title: 'Lamellen · op en neer',
      options: offeredOptions(airco, 'swing_modes', UP_DOWN_POSITIONS),
      chosenValue: currentValue('swing_mode'),
      choose: async (hass, chosenPosition) => {
        await turnOnIfOff(hass, airco);
        return hass.callService('climate', 'set_swing_mode', { swing_mode: chosenPosition }, target);
      },
    },
    {
      title: 'Lamellen · links en rechts',
      options: offeredOptions(airco, 'swing_horizontal_modes', LEFT_RIGHT_POSITIONS),
      chosenValue: currentValue('swing_horizontal_mode'),
      choose: async (hass, chosenPosition) => {
        await turnOnIfOff(hass, airco);
        return hass.callService('climate', 'set_swing_horizontal_mode', { swing_horizontal_mode: chosenPosition }, target);
      },
    },
  ];
}
