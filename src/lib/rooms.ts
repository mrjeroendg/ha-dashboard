import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';
import type { RoomConfig } from '../config/rooms';
import type { HomeAssistant } from '../types/hass';

export interface ResolvedRoom extends RoomConfig {
  rows: Array<{ entity: HassEntity; name: string }>;
}

/** Rooms from the config whose entities exist in HA (rooms with none are dropped). */
export function resolveRooms(rooms: RoomConfig[], states: HassEntities): ResolvedRoom[] {
  return rooms
    .map((room) => ({
      ...room,
      rows: room.entities
        .map((e) => (typeof e === 'string' ? { entity: e } : e))
        .filter((e) => e.entity in states)
        .map((e) => ({
          entity: states[e.entity],
          name: e.name ?? String(states[e.entity].attributes.friendly_name ?? e.entity),
        })),
    }))
    .filter((room) => room.rows.length > 0);
}

const domainOf = (e: HassEntity) => e.entity_id.split('.')[0];
const number = (value: unknown, digits = 1) =>
  Number(value).toLocaleString('nl-BE', { maximumFractionDigits: digits });

/** "2 lichten aan · 21°" */
export function roomSummary(room: ResolvedRoom, states: HassEntities): string {
  const lights = room.rows.filter((r) => domainOf(r.entity) === 'light');
  const on = lights.filter((r) => r.entity.state === 'on').length;
  const parts: string[] = [];

  if (lights.length > 0) {
    parts.push(on === 0 ? 'Lichten uit' : on === 1 ? '1 licht aan' : `${on} lichten aan`);
  }
  const temp = room.temperature ? Number.parseFloat(states[room.temperature]?.state ?? '') : NaN;
  if (!Number.isNaN(temp)) parts.push(`${number(temp)}°`);

  return parts.join(' · ') || 'Alleen sensoren';
}

// ---------------------------------------------------------------- rows

export type RowKind = 'toggle' | 'action' | 'climate' | 'readonly';

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
  run?(hass: HomeAssistant): Promise<unknown>;
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

/** Set a light's brightness (1–100%); turns it on if needed. */
export function setBrightness(hass: HomeAssistant, entity: HassEntity, pct: number) {
  return hass.callService('light', 'turn_on', { brightness_pct: pct }, { entity_id: entity.entity_id });
}

const UNAVAILABLE = new Set(['unavailable', 'unknown']);

export function rowModel(entity: HassEntity): RowModel {
  const domain = domainOf(entity);
  const id = entity.entity_id;
  const a = entity.attributes;
  const target = { entity_id: id };

  if (UNAVAILABLE.has(entity.state)) {
    return { kind: 'readonly', icon: iconFor(entity), detail: 'Niet beschikbaar', on: false };
  }

  switch (domain) {
    case 'light': {
      const on = entity.state === 'on';
      const pct = typeof a.brightness === 'number' ? Math.max(1, Math.round((a.brightness / 255) * 100)) : undefined;
      return {
        kind: 'toggle',
        icon: 'bulb',
        on,
        detail: on ? (pct !== undefined ? `Aan · ${pct}%` : 'Aan') : 'Uit',
        brightness: on && lightFeatures(entity).brightness ? (pct ?? 100) : undefined,
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
      return {
        kind: 'toggle',
        icon: 'blinds',
        on: open,
        detail: (open ? 'Open' : 'Dicht') + (open ? pos : ''),
        run: (h) => h.callService('cover', open ? 'close_cover' : 'open_cover', {}, target),
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
