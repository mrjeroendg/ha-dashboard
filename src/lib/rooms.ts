import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';
import type { RoomConfig, RoomEntity, RoomSafety } from '../config/rooms';
import type { Shortcut } from '../config/shortcuts';
import type { HomeAssistant } from '../types/hass';

export type Row = {
  entity: HassEntity;
  name: string;
  allowUnknownState?: boolean;
  simple?: boolean;
  /** Cover: the "My position" button entity, if it exists in HA. */
  myPosition?: string;
};

export interface ResolvedSection {
  /** Undefined for a room configured with a plain `entities` list. */
  title?: string;
  shortcuts: Shortcut[];
  rows: Row[];
}

export interface ResolvedRoom {
  id: string;
  name: string;
  icon: IconName;
  temperature?: string;
  humidity?: string;
  safety?: Array<string | RoomSafety>;
  sections: ResolvedSection[];
}

function resolveRows(entities: Array<string | RoomEntity>, states: HassEntities): Row[] {
  return entities
    .map((e) => (typeof e === 'string' ? { entity: e } : e))
    .filter((e) => e.entity in states)
    .map((e) => ({
      entity: states[e.entity],
      name: e.name ?? String(states[e.entity].attributes.friendly_name ?? e.entity),
      allowUnknownState: e.allowUnknownState,
      simple: e.simple,
      myPosition: e.myPosition && e.myPosition in states ? e.myPosition : undefined,
    }));
}

/**
 * Rooms from the config whose entities exist in HA. Sections without any are
 * dropped, and so are rooms with no sections left.
 */
export function resolveRooms(rooms: RoomConfig[], states: HassEntities): ResolvedRoom[] {
  return rooms
    .map(({ id, name, icon, temperature, humidity, safety, ...list }) => ({
      id,
      name,
      icon,
      temperature,
      humidity,
      safety,
      sections: (list.sections ?? [{ title: undefined, shortcuts: [], entities: list.entities ?? [] }])
        .map((s) => ({ title: s.title, shortcuts: s.shortcuts ?? [], rows: resolveRows(s.entities, states) }))
        .filter((s) => s.rows.length > 0 || s.shortcuts.length > 0),
    }))
    .filter((room) => room.sections.length > 0);
}

const domainOf = (e: HassEntity) => e.entity_id.split('.')[0];
const number = (value: unknown, digits = 1) =>
  Number(value).toLocaleString('nl-BE', { maximumFractionDigits: digits });

// ---------------------------------------------------------------- rows

export type RowKind = 'toggle' | 'action' | 'climate' | 'cover' | 'readonly';

export interface RowModel {
  kind: RowKind;
  icon: IconName;
  /** Second line, e.g. "Aan · 80%" or "Dicht". */
  detail: string;
  /** Toggle position / highlighted icon. */
  on: boolean;
  /** Label of the action button for kind 'action'. */
  actionLabel?: string;
  /** Brightness 1–100 when the light is on and dimmable; shows a slider. */
  brightness?: number;
  /** Present when the light is on and supports color or color temperature. */
  color?: LightColor;
  run?(hass: HomeAssistant): Promise<unknown>;
  /** Cover buttons, from its supported_features. */
  cover?: { open: boolean; stop: boolean; close: boolean };
}

const COLOR_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'];

/** What a light can do, from its `supported_color_modes` (present even when off). */
export function lightFeatures(entity: HassEntity) {
  const modes = (entity.attributes.supported_color_modes as string[] | undefined) ?? [];
  return {
    brightness: modes.some((m) => m !== 'onoff'),
    color: modes.some((m) => COLOR_MODES.includes(m)),
    colorTemp: modes.includes('color_temp'),
  };
}

export type RGB = [number, number, number];

/** The light's current color, in the form the picker needs. */
export interface LightColor {
  supportsColor: boolean;
  supportsTemp: boolean;
  minKelvin: number;
  maxKelvin: number;
  /** What the light is showing now; HA also reports rgb_color in color_temp mode. */
  rgb?: RGB;
  kelvin?: number;
}

/** A color choice: either an RGB color or a white temperature. */
export type ColorChoice = { rgb: RGB } | { kelvin: number };

/** Set a light's color or white temperature; turns it on if needed. */
export function setColor(hass: HomeAssistant, entity: HassEntity, choice: ColorChoice) {
  const data = 'rgb' in choice ? { rgb_color: choice.rgb } : { color_temp_kelvin: choice.kelvin };
  return hass.callService('light', 'turn_on', data, { entity_id: entity.entity_id });
}

function lightColor(entity: HassEntity): LightColor | undefined {
  const f = lightFeatures(entity);
  if (entity.state !== 'on' || (!f.color && !f.colorTemp)) return undefined;
  const a = entity.attributes;
  const inTempMode = a.color_mode === 'color_temp';
  return {
    supportsColor: f.color,
    supportsTemp: f.colorTemp,
    minKelvin: Number(a.min_color_temp_kelvin ?? 2000),
    maxKelvin: Number(a.max_color_temp_kelvin ?? 6500),
    rgb: Array.isArray(a.rgb_color) ? (a.rgb_color as RGB) : undefined,
    kelvin: inTempMode && typeof a.color_temp_kelvin === 'number' ? a.color_temp_kelvin : undefined,
  };
}

/** Set a light's brightness (1–100%); turns it on if needed. */
export function setBrightness(hass: HomeAssistant, entity: HassEntity, pct: number) {
  return hass.callService('light', 'turn_on', { brightness_pct: pct }, { entity_id: entity.entity_id });
}

const UNAVAILABLE = new Set(['unavailable', 'unknown']);

export interface RowOptions {
  /** Give a switch even while the state is 'unknown'. */
  allowUnknownState?: boolean;
  /** Light: only the switch, no brightness or colours. */
  simple?: boolean;
}

export function rowModel(entity: HassEntity, { allowUnknownState, simple }: RowOptions = {}): RowModel {
  // E.g. an RTS screen set up as a light never reports its state, so HA keeps
  // it 'unknown'. Still give it a switch, shown as off until HA assumes a state.
  // (Covers don't need this: their buttons work in any state.)
  if (allowUnknownState && entity.state === 'unknown' && domainOf(entity) !== 'cover') {
    return { ...rowModel({ ...entity, state: 'off' }, { simple }), detail: 'Onbekend' };
  }

  const domain = domainOf(entity);
  const id = entity.entity_id;
  const a = entity.attributes;
  const target = { entity_id: id };

  // A cover's buttons don't depend on its state, so an RTS screen stuck on 'unknown' still works.
  const coverUnknown = domain === 'cover' && entity.state === 'unknown';
  if (UNAVAILABLE.has(entity.state) && !coverUnknown) {
    return { kind: 'readonly', icon: iconFor(entity), detail: 'Niet beschikbaar', on: false };
  }

  switch (domain) {
    case 'light': {
      const on = entity.state === 'on';
      const pct =
        typeof a.brightness === 'number' && !simple ? Math.max(1, Math.round((a.brightness / 255) * 100)) : undefined;
      return {
        kind: 'toggle',
        icon: 'bulb',
        on,
        detail: on ? (pct !== undefined ? `Aan · ${pct}%` : 'Aan') : 'Uit',
        brightness: on && !simple && lightFeatures(entity).brightness ? (pct ?? 100) : undefined,
        color: simple ? undefined : lightColor(entity),
        run: (h) => h.callService('light', 'toggle', {}, target),
      };
    }
    case 'switch':
    case 'fan':
    case 'input_boolean': {
      const on = entity.state === 'on';
      return {
        kind: 'toggle',
        icon: 'plug',
        on,
        detail: on ? 'Aan' : 'Uit',
        run: (h) => h.callService(domain, 'toggle', {}, target),
      };
    }
    case 'cover': {
      const open = entity.state === 'open' || entity.state === 'opening';
      const pos = typeof a.current_position === 'number' ? ` · ${a.current_position}%` : '';
      // OPEN 1, CLOSE 2, STOP 8; without supported_features, assume all three.
      const f = typeof a.supported_features === 'number' ? a.supported_features : 1 | 2 | 8;
      return {
        kind: 'cover',
        icon: 'blinds',
        on: open,
        // Unknown (RTS): only the name, no second line.
        detail: coverUnknown ? '' : (open ? 'Open' : 'Dicht') + (open ? pos : ''),
        cover: { open: Boolean(f & 1), stop: Boolean(f & 8), close: Boolean(f & 2) },
      };
    }
    case 'lock': {
      // Only locking from the dashboard; unlocking the front door with one tap is too easy.
      const locked = entity.state === 'locked';
      return locked
        ? { kind: 'readonly', icon: 'lock', on: false, detail: 'Op slot' }
        : {
            kind: 'action',
            icon: 'lock',
            on: true,
            detail: 'Niet op slot',
            actionLabel: 'Op slot',
            run: (h) => h.callService('lock', 'lock', {}, target),
          };
    }
    case 'media_player': {
      const playing = entity.state === 'playing';
      return {
        kind: 'toggle',
        icon: 'music',
        on: playing,
        detail: playing ? String(a.media_title ?? 'Speelt') : entity.state === 'off' ? 'Uit' : 'Gepauzeerd',
        run: (h) => h.callService('media_player', 'media_play_pause', {}, target),
      };
    }
    case 'climate':
      return {
        kind: 'climate',
        icon: 'thermometer',
        on: entity.state !== 'off',
        detail: `Nu ${number(a.current_temperature)}° · doel ${number(a.temperature)}°`,
      };
    case 'scene':
    case 'script':
      return {
        kind: 'action',
        icon: 'play',
        on: false,
        detail: domain === 'scene' ? 'Scène' : 'Script',
        actionLabel: 'Start',
        run: (h) => h.callService(domain, 'turn_on', {}, target),
      };
    default:
      return { kind: 'readonly', icon: iconFor(entity), on: false, detail: readableState(entity) };
  }
}

/** Climate +/- buttons: nudge the target temperature by `step` degrees. */
export function adjustTemperature(hass: HomeAssistant, entity: HassEntity, step: number) {
  const current = Number(entity.attributes.temperature ?? 20);
  return hass.callService(
    'climate',
    'set_temperature',
    { temperature: Math.round((current + step) * 2) / 2 },
    { entity_id: entity.entity_id },
  );
}

function iconFor(entity: HassEntity): IconName {
  const dc = String(entity.attributes.device_class ?? '');
  if (dc === 'temperature') return 'thermometer';
  if (dc === 'humidity' || dc === 'moisture') return 'droplet';
  if (dc === 'window') return 'window';
  if (dc === 'door' || dc === 'garage_door') return 'door';
  return 'gauge';
}

function readableState(entity: HassEntity): string {
  const domain = domainOf(entity);
  const dc = String(entity.attributes.device_class ?? '');

  if (domain === 'binary_sensor') {
    const on = entity.state === 'on';
    if (['window', 'door', 'garage_door', 'opening'].includes(dc)) return on ? 'Open' : 'Dicht';
    if (dc === 'motion' || dc === 'occupancy') return on ? 'Beweging' : 'Geen beweging';
    if (dc === 'moisture') return on ? 'Nat' : 'Droog';
    return on ? 'Aan' : 'Uit';
  }

  const value = Number.parseFloat(entity.state);
  const unit = entity.attributes.unit_of_measurement ? String(entity.attributes.unit_of_measurement) : '';
  if (!Number.isNaN(value)) return `${number(value)}${unit === '°C' ? '°' : unit === '%' ? '%' : unit ? ` ${unit}` : ''}`;
  return entity.state;
}

// ---------------------------------------------------------------- header

/** A sensor's value as a number, or undefined when missing or unavailable. */
function sensorValue(states: HassEntities, id?: string): number | undefined {
  const value = id ? Number.parseFloat(states[id]?.state ?? '') : Number.NaN;
  return Number.isNaN(value) ? undefined : value;
}

/** The room header's climate: "20,4°" large, "56% vochtigheid" below (docs/design/room-header). */
export function roomClimate(room: ResolvedRoom, states: HassEntities) {
  const temperature = sensorValue(states, room.temperature);
  const humidity = sensorValue(states, room.humidity);
  if (temperature === undefined && humidity === undefined) return undefined;
  const pct = humidity === undefined ? undefined : `${number(humidity, 0)}%`;
  // Without a temperature, the humidity takes the large spot.
  return temperature !== undefined
    ? { value: `${number(temperature)}°`, label: pct && `${pct} vochtigheid` }
    : { value: pct!, label: 'vochtigheid' };
}

/** 'high' is red, 'medium' orange; undefined means in orde. */
export type SafetyLevel = 'high' | 'medium';

export interface SafetyItem {
  id: string;
  name: string;
  icon: IconName;
  state: string;
  level?: SafetyLevel;
}

/** A door: "Open" (red) or "Dicht". */
function doorItem(entity: HassEntity): Pick<SafetyItem, 'icon' | 'state' | 'level'> {
  const open = entity.state === 'on';
  return open ? { icon: 'door', state: 'Open', level: 'high' } : { icon: 'door', state: 'Dicht' };
}

/** A smoke detector: "Rook" (red), a low battery (orange under 15%, red under 10%), or "Ok". */
function smokeItem(entity: HassEntity, battery?: number): Pick<SafetyItem, 'icon' | 'state' | 'level'> {
  if (entity.state === 'on') return { icon: 'smoke', state: 'Rook', level: 'high' };
  if (battery === undefined || battery >= 15) return { icon: 'smoke', state: 'Ok' };
  const level = battery < 10 ? 'high' : 'medium';
  return { icon: 'smoke', state: `Batterij ${number(battery, 0)}%`, level };
}

/**
 * Doors and smoke detectors of a room (docs/design/room-safety), told apart by
 * their device class. Missing or unavailable entities, and other device
 * classes, are left out.
 */
export function roomSafety(room: ResolvedRoom, states: HassEntities) {
  const items: SafetyItem[] = (room.safety ?? [])
    .map((s) => (typeof s === 'string' ? { entity: s } : s))
    .filter((s) => s.entity in states && !UNAVAILABLE.has(states[s.entity].state))
    .flatMap((s) => {
      const entity = states[s.entity];
      const deviceClass = entity.attributes.device_class;
      const name = s.name ?? String(entity.attributes.friendly_name ?? s.entity);
      if (deviceClass === 'door') return [{ id: s.entity, name, ...doorItem(entity) }];
      if (deviceClass === 'smoke') return [{ id: s.entity, name, ...smokeItem(entity, sensorValue(states, s.battery)) }];
      return [];
    });
  if (items.length === 0) return undefined;

  const red = items.filter((i) => i.level === 'high');
  const orange = items.filter((i) => i.level === 'medium');
  const attention = [...red, ...orange];
  const ok = items.filter((i) => !i.level);
  const level: SafetyLevel | undefined = red.length ? 'high' : orange.length ? 'medium' : undefined;
  const summary =
    attention.length === 0
      ? 'Alles in orde'
      : `${attention.length} ${attention.length === 1 ? 'vraagt' : 'vragen'} aandacht`;

  return { items, attention, ok, level, summary };
}
