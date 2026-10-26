import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { ChoiceOption } from '../components/ChoiceRow';
import type { MowerConfig } from '../config/rooms';
import type { HomeAssistant } from '../types/hass';

/** The lawn_mower states (docs/design/lawn-mower). */
const MOWER_STATE_NAMES: Record<string, string> = {
  mowing: 'Maait',
  docked: 'In het laadstation',
  paused: 'Gepauzeerd',
  returning: 'Keert terug',
  error: 'Fout',
};

/** Landroid Cloud's error sensor values. One that isn't listed is shown as it comes, e.g. "New error". */
const ERROR_NAMES: Record<string, string> = {
  trapped: 'Zit vast',
  trapped_timeout: 'Zit te lang vast',
  lifted: 'Opgetild',
  upside_down: 'Ligt ondersteboven',
  wire_missing: 'Draad ontbreekt',
  outside_wire: 'Buiten de draad',
  reverse_wire: 'Draad omgekeerd',
  wire_sync: 'Draadsignaal kwijt',
  rain_delay: 'Wacht op droog weer',
  close_door_to_mow: 'Sluit de klep om te maaien',
  close_door_to_go_home: 'Sluit de klep om naar huis te gaan',
  blade_motor_blocked: 'Mesmotor geblokkeerd',
  wheel_motor_blocked: 'Wielmotor geblokkeerd',
  blade_height_adjustment_blocked: 'Maaihoogte geblokkeerd',
  battery_low: 'Batterij bijna leeg',
  battery_temperature_error: 'Batterij te warm of te koud',
  battery_trunk_open_timeout: 'Batterijklep te lang open',
  charge_error: 'Laadfout',
  timeout_finding_home: 'Vindt het laadstation niet',
  charging_station_docking_error: 'Kan niet aanmeren',
  unreachable_charging_station: 'Laadstation onbereikbaar',
  missing_charging_station: 'Laadstation ontbreekt',
  unreachable_zone: 'Zone onbereikbaar',
  excessive_slope: 'Helling te steil',
  locked: 'Vergrendeld',
  ota_error: 'Update mislukt',
  map_error: 'Kaartfout',
  mapping_exploration_required: 'Moet de tuin eerst verkennen',
  mapping_exploration_failed: 'Verkennen mislukt',
  training_start_disallowed: 'Training niet toegestaan',
  insufficient_sensor_data: 'Te weinig sensordata',
  camera_error: 'Camerafout',
  headlight_error: 'Lampfout',
  rfid_reader_error: 'RFID-lezer defect',
  hbi_error: 'HBI-fout',
};

const NO_ERROR_VALUES = new Set(['no_error', 'unknown', 'unavailable']);

/** Rain delay comes in as an error, but it's just her waiting: no red. */
const WAITING_FOR_DRY_WEATHER = 'rain_delay';

/** lawn_mower supported_features bits. */
const CAN_START_MOWING = 1;
const CAN_PAUSE = 2;
const CAN_DOCK = 4;

const readableNumber = (value: number, digits = 1) => value.toLocaleString('nl-BE', { maximumFractionDigits: digits });
const readableTime = (moment: Date) => moment.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

/** "rain_delay" → "Rain delay", for a value without a Dutch name. */
const readableValue = (value: string) => {
  const withSpaces = value.replace(/_/g, ' ');
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

function numberState(states: HassEntities, entityId: string | undefined): number | undefined {
  const stateFromEntity = entityId ? states[entityId]?.state : undefined;
  const numberFromEntity = Number.parseFloat(stateFromEntity ?? '');

  return Number.isNaN(numberFromEntity) ? undefined : numberFromEntity;
}

/** A binary sensor: true, false, or undefined when it isn't configured or not available. */
function isOn(states: HassEntities, entityId: string | undefined): boolean | undefined {
  const stateFromEntity = entityId ? states[entityId]?.state : undefined;
  if (stateFromEntity === 'on') return true;
  if (stateFromEntity === 'off') return false;
  return undefined;
}

export interface MowerStatus {
  /** "Maait", "In het laadstation", or the error, e.g. "Zit vast". */
  title: string;
  isError: boolean;
  /** When the error started. */
  errorSince?: Date;
}

export function mowerStatus(mower: HassEntity, config: MowerConfig, states: HassEntities): MowerStatus {
  const errorEntity = config.error ? states[config.error] : undefined;
  const hasError = errorEntity !== undefined && !NO_ERROR_VALUES.has(errorEntity.state);

  if (hasError && errorEntity.state === WAITING_FOR_DRY_WEATHER) {
    return { title: ERROR_NAMES[WAITING_FOR_DRY_WEATHER], isError: false };
  }

  if (hasError) {
    const errorName = ERROR_NAMES[errorEntity.state] ?? readableValue(errorEntity.state);

    return { title: errorName, isError: true, errorSince: new Date(errorEntity.last_changed) };
  }

  const isMowerInError = mower.state === 'error';

  return { title: MOWER_STATE_NAMES[mower.state] ?? readableValue(mower.state), isError: isMowerInError };
}

export function batteryPercentage(config: MowerConfig, states: HassEntities) {
  return numberState(states, config.battery);
}

/** The row's second line: "Maait · 64%", or only the error ("Zit vast"). */
export function mowerRowDetail(mower: HassEntity, config: MowerConfig, states: HassEntities): string {
  const status = mowerStatus(mower, config, states);
  const battery = batteryPercentage(config, states);
  const isBatteryShown = !status.isError && battery !== undefined;

  return isBatteryShown ? `${status.title} · ${readableNumber(battery, 0)}%` : status.title;
}

/**
 * The zone the select is on, by its name from the config. Only shown, never
 * chosen: Landroid Cloud can't choose a zone for RTK/Vision mowers yet ("Zone
 * selection for RTK/Vision devices is not supported yet").
 */
function chosenZoneName(config: MowerConfig, states: HassEntities): string | undefined {
  const chosenZoneOption = config.zone ? states[config.zone]?.state : undefined;

  return config.zones?.find((zone) => zone.option === chosenZoneOption)?.name;
}

/** Under the title in the sheet: "Laadt niet · batterij 100%", "Voortuin · batterij 64%", "Sinds 14:02 · batterij 52%". */
export function mowerSheetDetail(mower: HassEntity, config: MowerConfig, states: HassEntities): string {
  const status = mowerStatus(mower, config, states);
  const battery = batteryPercentage(config, states);
  const isCharging = isOn(states, config.charging);

  const sinceError = status.errorSince && `Sinds ${readableTime(status.errorSince)}`;
  const chargingWhileDocked = mower.state === 'docked' && isCharging !== undefined && (isCharging ? 'Laadt op' : 'Laadt niet');
  const zoneWhileMowing = mower.state === 'mowing' && chosenZoneName(config, states);
  const batteryPart = battery !== undefined && `batterij ${readableNumber(battery, 0)}%`;

  const detailParts = [sinceError, chargingWhileDocked, zoneWhileMowing, batteryPart].filter((part): part is string => Boolean(part));
  const sentence = detailParts.join(' · ');

  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

// ---------------------------------------------------------------- choices in the sheet

/**
 * Bediening: what she can do, by her supported_features. The value is what she'll be doing.
 * Maaien and Pauze are permanently disabled: from the dashboard she can only be sent home.
 * They still show what she's doing.
 */
export function mowerControls(mower: HassEntity): ChoiceOption[] {
  const supportedFeatures = Number(mower.attributes.supported_features ?? 0);
  const controls: Array<ChoiceOption & { feature: number }> = [
    { value: 'mowing', name: 'Maaien', icon: 'play', feature: CAN_START_MOWING, isDisabled: true },
    { value: 'paused', name: 'Pauze', icon: 'pause', feature: CAN_PAUSE, isDisabled: true },
    { value: 'docked', name: 'Naar huis', icon: 'home', feature: CAN_DOCK },
  ];

  return controls.filter((control) => (supportedFeatures & control.feature) !== 0);
}

/** Which control is filled: on her way home counts as "Naar huis"; an error fills none. */
export function chosenMowerControl(mower: HassEntity): string | undefined {
  if (mower.state === 'returning') return 'docked';
  return ['mowing', 'paused', 'docked'].includes(mower.state) ? mower.state : undefined;
}

const MOWER_SERVICES: Record<string, string> = { mowing: 'start_mowing', paused: 'pause', docked: 'dock' };

export function controlMower(hass: HomeAssistant, mower: HassEntity, chosenControl: string) {
  return hass.callService('lawn_mower', MOWER_SERVICES[chosenControl], {}, { entity_id: mower.entity_id });
}

// ---------------------------------------------------------------- lists in the sheet

export interface MowerListLine {
  name: string;
  icon: 'sprout' | 'battery' | 'droplet' | 'signal' | 'blade' | 'route';
  value: string;
  /** A red dot: wet, or offline. */
  needsAttention?: boolean;
}

/** Status: zone, battery, rain, connection. A line whose entity isn't configured or available is left out. */
export function mowerStatusLines(config: MowerConfig, states: HassEntities): MowerListLine[] {
  const activeZoneName = chosenZoneName(config, states);
  const battery = batteryPercentage(config, states);
  const isCharging = isOn(states, config.charging);
  const isWet = isOn(states, config.rain);
  const isOnline = isOn(states, config.online);

  const zoneLine: MowerListLine | undefined = activeZoneName !== undefined
    ? { name: 'Zone', icon: 'sprout', value: activeZoneName }
    : undefined;
  const batteryLine: MowerListLine | undefined = battery !== undefined
    ? { name: 'Batterij', icon: 'battery', value: `${readableNumber(battery, 0)}%${isCharging ? ' · laadt op' : ''}` }
    : undefined;
  const rainLine: MowerListLine | undefined = isWet !== undefined
    ? { name: 'Regen', icon: 'droplet', value: isWet ? 'Nat' : 'Droog', needsAttention: isWet }
    : undefined;
  const connectionLine: MowerListLine | undefined = isOnline !== undefined
    ? { name: 'Verbinding', icon: 'signal', value: isOnline ? 'Online' : 'Offline', needsAttention: !isOnline }
    : undefined;

  return [zoneLine, batteryLine, rainLine, connectionLine].filter((line): line is MowerListLine => line !== undefined);
}

/** Onderhoud: blade hours since the last reset, distance driven. */
export function mowerUpkeepLines(config: MowerConfig, states: HassEntities): MowerListLine[] {
  const bladeHours = numberState(states, config.bladeHours);
  const distance = numberState(states, config.distance);

  const bladeLine: MowerListLine | undefined = bladeHours !== undefined
    ? { name: 'Messen', icon: 'blade', value: `${readableNumber(bladeHours)} u gedraaid` }
    : undefined;
  const distanceLine: MowerListLine | undefined = distance !== undefined
    ? { name: 'Afgelegd', icon: 'route', value: `${readableNumber(distance)} km` }
    : undefined;

  return [bladeLine, distanceLine].filter((line): line is MowerListLine => line !== undefined);
}
