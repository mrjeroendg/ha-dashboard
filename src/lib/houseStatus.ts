import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { STATUS, type StatusEntity } from '../config/status';
import type { HomeAssistant } from '../types/hass';
import { Entity } from '../config/entities';

const UNAVAILABLE = new Set(['unavailable', 'unknown']);
const OPEN = new Set(['on', 'open', 'opening']);

/** Jeroen's office days at Banqup (docs/design/commute). */
const COMMUTE = {
  travelTimeHome: Entity.JEROEN_TRAVEL_TIME_HOME,
  person: Entity.PERSON_JEROEN,
  userId: '948e49d9b8eb426aa1f994c353e0aad9',
  officeZone: 'Banqup',
  /** Tuesday and Wednesday (Sunday is 0). */
  officeDays: [2, 3],
  fromHour: 16,
  untilHour: 18,
};

/** Opens Waze on the phone and starts the route to the "Home" favourite saved in Waze. */
export const WAZE_ROUTE_HOME = 'https://waze.com/ul?favorite=home&navigate=yes';

/** A status entry whose entity exists in HA and is available, with its name. */
export interface ListedEntity {
  entity: HassEntity;
  name: string;
}

/** The listed entries whose entities exist and are available. */
function listed(states: HassEntities, statusEntries: StatusEntity[]): ListedEntity[] {
  return statusEntries
    .filter((statusEntry) => {
      const entityFromHass = states[statusEntry.entity];
      return entityFromHass !== undefined && !UNAVAILABLE.has(entityFromHass.state);
    })
    .map((statusEntry) => {
      const entityFromHass = states[statusEntry.entity];
      const nameFromHass = String(entityFromHass.attributes.friendly_name ?? statusEntry.entity);
      return { entity: entityFromHass, name: statusEntry.name ?? nameFromHass };
    });
}

function presence(states: HassEntities): string | undefined {
  const people = listed(states, STATUS.people);
  if (people.length === 0) return undefined;

  const peopleAtHome = people.filter((person) => person.entity.state === 'home');
  if (peopleAtHome.length === 0) return 'Niemand thuis';
  if (peopleAtHome.length === people.length) return people.length === 1 ? 'Je bent thuis' : 'Iedereen thuis';

  // Without a name in the config, the first word of HA's name ("Jeroen De Groote" → "Jeroen").
  const firstNamesAtHome = peopleAtHome.map((person) => person.name.split(' ')[0]);
  return `${firstNamesAtHome.join(' & ')} thuis`;
}

/**
 * The groups of "Wat staat aan" (docs/design/whats-on): exactly the switchable
 * things the status line counts, grouped by their list in src/config/status.ts.
 * Doors and windows count too, but can't be switched off, so they're not here.
 */
export const WHAT_IS_ON_GROUPS = [{ title: 'Lichten', statusEntries: STATUS.lights, oneOn: '1 licht aan', manyOn: 'lichten aan' }];

/** The entries of a group whose entity is on right now. */
export function entriesThatAreOn(states: HassEntities, statusEntries: StatusEntity[]): StatusEntity[] {
  return statusEntries.filter((statusEntry) => {
    const entityFromHass = states[statusEntry.entity];
    return entityFromHass !== undefined && entityFromHass.state === 'on';
  });
}

function lights(states: HassEntities): string | undefined {
  const listedLights = listed(states, STATUS.lights);
  if (listedLights.length === 0) return undefined;

  const lightsOn = listedLights.filter((light) => light.entity.state === 'on').length;
  if (lightsOn === 0) return 'alle lichten uit';
  return lightsOn === 1 ? '1 licht aan' : `${lightsOn} lichten aan`;
}

function openings(states: HassEntities): string | undefined {
  const listedOpenings = listed(states, STATUS.openings);
  if (listedOpenings.length === 0) return undefined;

  const openingsOpen = listedOpenings.filter((opening) => OPEN.has(opening.entity.state)).length;
  if (openingsOpen === 0) return 'alles gesloten';
  return openingsOpen === 1 ? '1 deur of raam open' : `${openingsOpen} deuren of ramen open`;
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
 * "Iedereen thuis · 3 lichten aan · alles gesloten". Only the entities in
 * src/config/status.ts count.
 */
export function houseStatus(states: HassEntities): string {
  const statusParts = [presence(states), lights(states), openings(states)].filter((statusPart): statusPart is string =>
    Boolean(statusPart),
  );

  const sentence = statusParts.join(' · ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
