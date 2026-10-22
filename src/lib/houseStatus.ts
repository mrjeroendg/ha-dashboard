import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { STATUS } from '../config/status';

const UNAVAILABLE = new Set(['unavailable', 'unknown']);
const OPEN = new Set(['on', 'open', 'opening']);

/** The listed entities that exist and are available. */
function listed(states: HassEntities, ids: string[]): HassEntity[] {
  return ids.map((id) => states[id]).filter((e): e is HassEntity => !!e && !UNAVAILABLE.has(e.state));
}

function presence(states: HassEntities): string | undefined {
  const people = listed(states, STATUS.people);
  if (people.length === 0) return undefined;
  const home = people.filter((p) => p.state === 'home');
  if (home.length === 0) return 'Niemand thuis';
  if (home.length === people.length) return people.length === 1 ? 'Je bent thuis' : 'Iedereen thuis';
  const names = home.map((p) => String(p.attributes.friendly_name ?? p.entity_id).split(' ')[0]);
  return `${names.join(' & ')} thuis`;
}

function lights(states: HassEntities): string | undefined {
  const all = listed(states, STATUS.lights);
  if (all.length === 0) return undefined;
  const on = all.filter((l) => l.state === 'on').length;
  if (on === 0) return 'alle lichten uit';
  return on === 1 ? '1 licht aan' : `${on} lichten aan`;
}

function openings(states: HassEntities): string | undefined {
  const open = listed(states, STATUS.openings).filter((s) => OPEN.has(s.state)).length;
  if (open === 0) return undefined;
  return open === 1 ? '1 deur of raam open' : `${open} deuren of ramen open`;
}

function temperature(states: HassEntities): string | undefined {
  const value = Number.parseFloat((STATUS.temperature && states[STATUS.temperature]?.state) ?? '');
  if (Number.isNaN(value)) return undefined;
  return `${value.toLocaleString('nl-BE', { maximumFractionDigits: 1 })}° binnen`;
}

/**
 * One short, calm sentence about the house, e.g.
 * "Iedereen thuis · 3 lichten aan · 21,5° binnen". Only the entities in
 * src/config/status.ts count.
 */
export function houseStatus(states: HassEntities): string {
  const parts = [presence(states), lights(states), openings(states), temperature(states)].filter(
    (p): p is string => Boolean(p),
  );

  const sentence = parts.join(' · ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
