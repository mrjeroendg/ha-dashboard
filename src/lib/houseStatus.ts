import type { HassEntities } from 'home-assistant-js-websocket';
import type { DashboardConfig } from '../types/hass';

const UNAVAILABLE = new Set(['unavailable', 'unknown']);
const OPENING_CLASSES = new Set(['door', 'window', 'garage_door', 'opening']);

function entitiesOf(states: HassEntities, domain: string) {
  return Object.values(states).filter((e) => e.entity_id.startsWith(`${domain}.`));
}

function presence(states: HassEntities): string | undefined {
  const people = entitiesOf(states, 'person').filter((p) => !UNAVAILABLE.has(p.state));
  if (people.length === 0) return undefined;
  const home = people.filter((p) => p.state === 'home');
  if (home.length === 0) return 'Niemand thuis';
  if (home.length === people.length) return people.length === 1 ? 'Je bent thuis' : 'Iedereen thuis';
  const names = home.map((p) => String(p.attributes.friendly_name ?? p.entity_id).split(' ')[0]);
  return `${names.join(' & ')} thuis`;
}

function lights(states: HassEntities): string {
  const on = entitiesOf(states, 'light').filter((l) => l.state === 'on').length;
  if (on === 0) return 'alle lichten uit';
  return on === 1 ? '1 licht aan' : `${on} lichten aan`;
}

function openings(states: HassEntities): string | undefined {
  const open = entitiesOf(states, 'binary_sensor').filter(
    (s) => s.state === 'on' && OPENING_CLASSES.has(String(s.attributes.device_class)),
  ).length;
  if (open === 0) return undefined;
  return open === 1 ? '1 deur of raam open' : `${open} deuren of ramen open`;
}

function temperature(states: HassEntities, entityId?: string): string | undefined {
  if (!entityId) return undefined;
  const value = Number.parseFloat(states[entityId]?.state ?? '');
  if (Number.isNaN(value)) return undefined;
  return `${value.toLocaleString('nl-BE', { maximumFractionDigits: 1 })}° binnen`;
}

/**
 * One short, calm sentence about the house, e.g.
 * "Iedereen thuis · 3 lichten aan · 21,5° binnen".
 */
export function houseStatus(states: HassEntities, config: DashboardConfig): string {
  const parts = [
    presence(states),
    lights(states),
    openings(states),
    temperature(states, config.temperature_entity),
  ].filter((p): p is string => Boolean(p));

  const sentence = parts.join(' · ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
