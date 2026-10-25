import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { STATUS } from '../config/status';
import type { HomeAssistant } from '../types/hass';

const UNAVAILABLE = new Set(['unavailable', 'unknown']);
const OPEN = new Set(['on', 'open', 'opening']);

/** Jeroen's office days at Banqup (docs/design/commute). */
const COMMUTE = {
  travelTimeHome: 'sensor.commuting_home_travel_time_jeroen',
  person: 'person.jeroen',
  userId: '948e49d9b8eb426aa1f994c353e0aad9',
  officeZone: 'Banqup',
  /** Tuesday and Wednesday (Sunday is 0). */
  officeDays: [2, 3],
  fromHour: 16,
  untilHour: 18,
};

/** Opens Waze on the phone and starts the route to the "Home" favourite saved in Waze. */
export const WAZE_ROUTE_HOME = 'https://waze.com/ul?favorite=home&navigate=yes';

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

/**
 * The groups of "Wat staat aan" (docs/design/whats-on): exactly the switchable
 * things the status line counts, grouped by their list in src/config/status.ts.
 * Doors and windows count too, but can't be switched off, so they're not here.
 */
export const WHAT_IS_ON_GROUPS = [{ title: 'Lichten', entityIds: STATUS.lights, oneOn: '1 licht aan', manyOn: 'lichten aan' }];

/** The listed entities of a group that are on right now. */
export function entitiesThatAreOn(states: HassEntities, entityIds: string[]): string[] {
  return listed(states, entityIds)
    .filter((entity) => entity.state === 'on')
    .map((entity) => entity.entity_id);
}

function lights(states: HassEntities): string | undefined {
  const all = listed(states, STATUS.lights);
  if (all.length === 0) return undefined;
  const on = all.filter((l) => l.state === 'on').length;
  if (on === 0) return 'alle lichten uit';
  return on === 1 ? '1 licht aan' : `${on} lichten aan`;
}

function openings(states: HassEntities): string | undefined {
  const all = listed(states, STATUS.openings);
  if (all.length === 0) return undefined;
  const open = all.filter((s) => OPEN.has(s.state)).length;
  if (open === 0) return 'alles gesloten';
  return open === 1 ? '1 deur of raam open' : `${open} deuren of ramen open`;
}

function temperature(states: HassEntities): string | undefined {
  const value = Number.parseFloat((STATUS.temperature && states[STATUS.temperature]?.state) ?? '');
  if (Number.isNaN(value)) return undefined;
  return `${value.toLocaleString('nl-BE', { maximumFractionDigits: 1 })}° binnen`;
}

/**
 * "34 min naar huis", put in front of the status line. Only for Jeroen, on his
 * office days between 16:00 and 18:00, while he's at Banqup; otherwise nothing.
 */
export function commute(hass: HomeAssistant, now: Date): string | undefined {
  const isCommuterLoggedIn = hass.user?.id === COMMUTE.userId;
  const isOfficeDay = COMMUTE.officeDays.includes(now.getDay());
  const isTimeToHeadHome = now.getHours() >= COMMUTE.fromHour && now.getHours() < COMMUTE.untilHour;
  const isAtOffice = hass.states[COMMUTE.person]?.state === COMMUTE.officeZone;
  const travelTimeInMinutes = Number.parseFloat(hass.states[COMMUTE.travelTimeHome]?.state ?? '');
  const hasTravelTime = !Number.isNaN(travelTimeInMinutes);

  const isCommuting = isCommuterLoggedIn && isOfficeDay && isTimeToHeadHome && isAtOffice && hasTravelTime;

  return isCommuting ? `${Math.round(travelTimeInMinutes)} min naar huis` : undefined;
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
