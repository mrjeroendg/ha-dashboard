import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';
import { BIRTHDAYS, NOW, STATUS, type StatusEntity } from '../config/status';
import type { HomeAssistant } from '../types/hass';
import { isAircoOn } from './airco';
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

export const WAZE_ROUTE_HOME = 'https://waze.com/ul?favorite=home&navigate=yes';
export const SEND_WHATSAPP_MESSAGE = 'whatsapp://';


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
 * The groups of "Nu" (docs/design/whats-on, now-ticker): exactly the switchable
 * things the status band counts, grouped by their list in src/config/status.ts.
 * Doors and windows count too, but can't be switched off, so they're not here.
 */
export const WHAT_IS_ON_GROUPS = [
  { title: 'Lichten', statusEntries: STATUS.lights },
  { title: "Airco's", statusEntries: STATUS.aircos },
];

/** On, as the status band counts it: an airco in any mode but `off`, anything else when it's `on`. */
function isSwitchedOn(entity: HassEntity): boolean {
  const isAirco = entity.entity_id.startsWith('climate.');

  return isAirco ? isAircoOn(entity) : entity.state === 'on';
}

/** The entries of a group whose entity is on right now. */
export function entriesThatAreOn(states: HassEntities, statusEntries: StatusEntity[]): StatusEntity[] {
  return listed(states, statusEntries)
    .filter((listedEntity) => isSwitchedOn(listedEntity.entity))
    .map((listedEntity) => statusEntries.find((statusEntry) => statusEntry.entity === listedEntity.entity.entity_id))
    .filter((statusEntry): statusEntry is StatusEntity => statusEntry !== undefined);
}

function lights(states: HassEntities): string | undefined {
  const listedLights = listed(states, STATUS.lights);
  if (listedLights.length === 0) return undefined;

  const lightsOn = listedLights.filter((light) => light.entity.state === 'on').length;
  if (lightsOn === 0) return 'alle lichten uit';
  return lightsOn === 1 ? '1 licht aan' : `${lightsOn} lichten aan`;
}

/** "2 airco's aan"; nothing when none are on, so the band stays short. */
function aircos(states: HassEntities): string | undefined {
  const aircosOn = listed(states, STATUS.aircos).filter((airco) => isSwitchedOn(airco.entity)).length;
  if (aircosOn === 0) return undefined;

  return aircosOn === 1 ? '1 airco aan' : `${aircosOn} airco's aan`;
}

function openings(states: HassEntities): string | undefined {
  const listedOpenings = listed(states, STATUS.openings);
  if (listedOpenings.length === 0) return undefined;

  const openingsOpen = listedOpenings.filter((opening) => OPEN.has(opening.entity.state)).length;
  if (openingsOpen === 0) return 'alles gesloten';
  return openingsOpen === 1 ? '1 deur of raam open' : `${openingsOpen} deuren of ramen open`;
}

/**
 * "34 min naar huis", in the status band and in "Nu". Only for Jeroen, on his
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

/** One item in the status band: an icon, then white text, then grey text. */
export interface StatusItem {
  icon: IconName;
  /** The icon's colour; without one it's grey like the text. */
  iconColor?: string;
  highlighted?: string;
  text?: string;
}

/** Something from src/config/status.ts `NOW` that's on right now: "Cara is aan het drinken". */
function nowItems(states: HassEntities): StatusItem[] {
  return NOW.filter((nowEntity) => states[nowEntity.entity]?.state === 'on').map((nowEntity) => ({
    icon: nowEntity.icon,
    iconColor: nowEntity.color,
    highlighted: nowEntity.name,
    text: nowEntity.text,
  }));
}

/** "Jan is jarig" for one birthday, "2 jarigen vandaag" for more; nothing without. */
function birthdaysItem(birthdayNames: string[]): StatusItem | undefined {
  if (birthdayNames.length === 0) return undefined;

  const cake = { icon: BIRTHDAYS.icon, iconColor: BIRTHDAYS.color };
  const isOneBirthday = birthdayNames.length === 1;

  return isOneBirthday ? { ...cake, highlighted: birthdayNames[0], text: 'is jarig' } : { ...cake, text: `${birthdayNames.length} jarigen vandaag` };
}

/**
 * The status band on Thuis (docs/design/now-ticker), in this order: who's
 * home, today's birthdays, the travel time home, lights, aircos, doors and
 * windows, then what's happening now. Only the entities in
 * src/config/status.ts count.
 */
export function houseStatusItems(hass: HomeAssistant, now: Date, birthdayNames: string[]): StatusItem[] {
  const states = hass.states;
  const whoIsHome = presence(states);
  const travelTimeHome = commute(hass, now);
  const lightsPart = lights(states);
  const aircosPart = aircos(states);
  const openingsPart = openings(states);

  const statusItems: Array<StatusItem | undefined> = [
    whoIsHome ? { icon: 'home', iconColor: 'var(--accent)', highlighted: whoIsHome } : undefined,
    birthdaysItem(birthdayNames),
    travelTimeHome ? { icon: 'car', highlighted: travelTimeHome } : undefined,
    lightsPart ? { icon: 'bulb', text: lightsPart } : undefined,
    aircosPart ? { icon: 'snowflake', text: aircosPart } : undefined,
    openingsPart ? { icon: 'door', text: openingsPart } : undefined,
    ...nowItems(states),
  ];

  return statusItems.filter((statusItem): statusItem is StatusItem => statusItem !== undefined);
}
