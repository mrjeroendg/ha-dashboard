import type { HassEntities } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';
import type { HomeAssistant } from '../types/hass';
import { isWeekend, momentOf, type Moment } from './moment';

/**
 * Entity IDs the actions use. Swap these for your own; an action whose
 * required entities don't exist in HA is simply not shown.
 */
export const ENTITIES = {
  sceneMorning: 'scene.ochtend',
  sceneWeekend: 'scene.weekendochtend',
  sceneEvening: 'scene.gezellige_avond',
  sceneMovie: 'scene.film',
  scriptGoodnight: 'script.slaapwel',
  scriptLeave: 'script.vertrekken',
  scriptSprinkler: 'script.sproeier',
  scriptWakeLight: 'script.wekker_licht',
  coffee: 'switch.koffiemachine',
  climate: 'climate.woonkamer',
  blinds: 'cover.rolluiken',
  frontDoor: 'lock.voordeur',
  carBattery: 'sensor.auto_batterij',
  carCharging: 'switch.auto_laden',
  speaker: 'media_player.woonkamer',
  downstairsLights: ['light.keuken', 'light.gang', 'light.woonkamer', 'light.eettafel'],
} as const;

export interface ActionContext {
  now: Date;
  moment: Moment;
  weekend: boolean;
  states: HassEntities;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  /** Big "Voorgesteld" card candidate (scenes/routines). */
  suggestable?: boolean;
  /** Shown as a warning: something needs attention. */
  warning?: boolean;
  /** Entities that must exist for the action to be shown. */
  requires: readonly string[];
  /** How relevant the action is right now; 0 hides it. */
  relevance(ctx: ActionContext): number;
  /** Second line on the card: state or what tapping will do. */
  detail(ctx: ActionContext): string;
  /** Highlight the card (the thing is currently on/active). */
  active?(ctx: ActionContext): boolean;
  run(hass: HomeAssistant, ctx: ActionContext): Promise<unknown>;
}

// ---------------------------------------------------------------- helpers

const state = (ctx: ActionContext, id: string) => ctx.states[id]?.state;
const attr = (ctx: ActionContext, id: string, key: string) => ctx.states[id]?.attributes[key];
const isOn = (ctx: ActionContext, id: string) => state(ctx, id) === 'on';
const turnOn = (hass: HomeAssistant, entity_id: string) =>
  hass.callService(entity_id.split('.')[0], 'turn_on', {}, { entity_id });

const lightsOn = (ctx: ActionContext, ids: readonly string[]) => ids.filter((id) => isOn(ctx, id));

const openWindows = (ctx: ActionContext) =>
  Object.values(ctx.states).filter(
    (e) =>
      e.entity_id.startsWith('binary_sensor.') &&
      e.state === 'on' &&
      ['window', 'door', 'opening'].includes(String(e.attributes.device_class)),
  );

const anyoneHome = (ctx: ActionContext) =>
  Object.values(ctx.states).some((e) => e.entity_id.startsWith('person.') && e.state === 'home');

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ---------------------------------------------------------------- actions

export const ACTIONS: QuickAction[] = [
  // Routines (suggestable)
  {
    id: 'ochtend',
    label: 'Ochtend starten',
    icon: 'sun',
    suggestable: true,
    requires: [ENTITIES.sceneMorning],
    relevance: (c) => (c.moment === 'ochtend' && !c.weekend ? 100 : 0),
    detail: () => 'Keuken & gang aan · rolluiken open',
    run: (h) => turnOn(h, ENTITIES.sceneMorning),
  },
  {
    id: 'weekendochtend',
    label: 'Weekendochtend',
    icon: 'music',
    suggestable: true,
    requires: [ENTITIES.sceneWeekend],
    relevance: (c) => (c.weekend && c.now.getHours() >= 6 && c.now.getHours() < 12 ? 100 : 0),
    detail: () => 'Muziek in de keuken · zacht licht',
    run: (h) => turnOn(h, ENTITIES.sceneWeekend),
  },
  {
    id: 'avond',
    label: 'Gezellige avond',
    icon: 'sofa',
    suggestable: true,
    requires: [ENTITIES.sceneEvening],
    relevance: (c) => (c.moment === 'avond' ? 100 : 0),
    detail: () => 'Sfeerlicht woonkamer · rolluiken dicht',
    run: (h) => turnOn(h, ENTITIES.sceneEvening),
  },
  {
    id: 'slaapwel',
    label: 'Slaapwel',
    icon: 'moon',
    suggestable: true,
    requires: [ENTITIES.scriptGoodnight],
    relevance: (c) => (c.moment === 'nacht' ? 100 : 0),
    detail: () => 'Alles uit · deur op slot · 17°',
    run: (h) => turnOn(h, ENTITIES.scriptGoodnight),
  },

  // Warnings
  {
    id: 'raam-open',
    label: 'Raam open',
    icon: 'window',
    warning: true,
    requires: [],
    relevance: (c) => {
      if (openWindows(c).length === 0) return 0;
      return c.moment === 'nacht' ? 95 : c.moment === 'avond' ? 70 : 30;
    },
    detail: (c) => {
      const open = openWindows(c);
      return open.length === 1
        ? `${String(open[0].attributes.friendly_name ?? 'Raam')} staat open`
        : `${open.length} ramen of deuren open`;
    },
    // Nothing to switch remotely; the card is a reminder. Tapping is a no-op.
    run: async () => undefined,
  },
  {
    id: 'voordeur',
    label: 'Voordeur',
    icon: 'lock',
    requires: [ENTITIES.frontDoor],
    relevance: (c) => (state(c, ENTITIES.frontDoor) !== 'unlocked' ? 0 : c.moment === 'nacht' ? 90 : 35),
    detail: () => 'Open · tik om te vergrendelen',
    run: (h) => h.callService('lock', 'lock', {}, { entity_id: ENTITIES.frontDoor }),
  },

  // Regular quick actions
  {
    id: 'koffie',
    label: 'Koffie',
    icon: 'coffee',
    requires: [ENTITIES.coffee],
    relevance: (c) => (c.moment === 'ochtend' ? 85 : 0),
    detail: (c) => (isOn(c, ENTITIES.coffee) ? 'Machine staat aan' : 'Machine opwarmen'),
    active: (c) => isOn(c, ENTITIES.coffee),
    run: (h) => h.callService('switch', 'toggle', {}, { entity_id: ENTITIES.coffee }),
  },
  {
    id: 'verwarming',
    label: 'Verwarming',
    icon: 'thermometer',
    requires: [ENTITIES.climate],
    relevance: (c) => ({ ochtend: 70, dag: 30, avond: 60, nacht: 20 })[c.moment],
    detail: (c) => {
      const current = attr(c, ENTITIES.climate, 'current_temperature');
      const target = c.moment === 'avond' ? 21 : 20;
      return `Nu ${String(current).replace('.', ',')}° · naar ${target}°`;
    },
    active: (c) => state(c, ENTITIES.climate) === 'heat',
    run: (h, c) =>
      h.callService('climate', 'set_temperature', { temperature: c.moment === 'avond' ? 21 : 20 }, {
        entity_id: ENTITIES.climate,
      }),
  },
  {
    id: 'vertrekken',
    label: 'Ik vertrek',
    icon: 'leave',
    requires: [ENTITIES.scriptLeave],
    relevance: (c) => {
      if (!anyoneHome(c)) return 0;
      if (c.moment === 'ochtend') return c.weekend ? 50 : 75;
      return c.moment === 'dag' ? 60 : 0;
    },
    detail: () => 'Alles uit & alarm aan',
    run: (h) => turnOn(h, ENTITIES.scriptLeave),
  },
  {
    id: 'auto',
    label: 'Auto laden',
    icon: 'car',
    requires: [ENTITIES.carBattery, ENTITIES.carCharging],
    relevance: (c) => (!c.weekend && (c.moment === 'ochtend' || c.moment === 'avond') ? 65 : 25),
    detail: (c) => {
      const pct = state(c, ENTITIES.carBattery);
      return isOn(c, ENTITIES.carCharging) ? `${pct}% · aan het laden` : `${pct}% · niet aan het laden`;
    },
    active: (c) => isOn(c, ENTITIES.carCharging),
    run: (h) => h.callService('switch', 'toggle', {}, { entity_id: ENTITIES.carCharging }),
  },
  {
    id: 'rolluiken',
    label: 'Rolluiken',
    icon: 'blinds',
    requires: [ENTITIES.blinds],
    relevance: (c) => {
      const open = state(c, ENTITIES.blinds) === 'open';
      if (c.moment === 'avond' || c.moment === 'nacht') return open ? 75 : 20;
      return open ? 20 : 80;
    },
    detail: (c) => (state(c, ENTITIES.blinds) === 'open' ? 'Open · tik om te sluiten' : 'Dicht · tik om te openen'),
    run: (h, c) =>
      h.callService('cover', state(c, ENTITIES.blinds) === 'open' ? 'close_cover' : 'open_cover', {}, {
        entity_id: ENTITIES.blinds,
      }),
  },
  {
    id: 'film',
    label: 'Film kijken',
    icon: 'tv',
    requires: [ENTITIES.sceneMovie],
    relevance: (c) => (c.moment === 'avond' ? 80 : 0),
    detail: () => 'Dimmen & tv aan',
    run: (h) => turnOn(h, ENTITIES.sceneMovie),
  },
  {
    id: 'muziek',
    label: 'Muziek',
    icon: 'music',
    requires: [ENTITIES.speaker],
    relevance: (c) => (c.moment === 'avond' ? 55 : c.weekend && c.moment !== 'nacht' ? 60 : 15),
    detail: (c) => (state(c, ENTITIES.speaker) === 'playing' ? 'Speelt in de woonkamer' : 'Woonkamer'),
    active: (c) => state(c, ENTITIES.speaker) === 'playing',
    run: (h) => h.callService('media_player', 'media_play_pause', {}, { entity_id: ENTITIES.speaker }),
  },
  {
    id: 'tuin',
    label: 'Tuin',
    icon: 'sprout',
    requires: [ENTITIES.scriptSprinkler],
    relevance: (c) => (c.weekend && (c.moment === 'ochtend' || c.moment === 'dag') ? 58 : 0),
    detail: () => 'Sproeier 10 min',
    run: (h) => turnOn(h, ENTITIES.scriptSprinkler),
  },
  {
    id: 'beneden-uit',
    label: 'Beneden uit',
    icon: 'power',
    requires: ENTITIES.downstairsLights,
    relevance: (c) => (lightsOn(c, ENTITIES.downstairsLights).length === 0 ? 0 : c.moment === 'nacht' ? 85 : 10),
    detail: (c) => plural(lightsOn(c, ENTITIES.downstairsLights).length, 'licht aan', 'lichten aan'),
    run: (h, c) => h.callService('light', 'turn_off', {}, { entity_id: lightsOn(c, ENTITIES.downstairsLights) }),
  },
  {
    id: 'wekker',
    label: 'Wekker licht',
    icon: 'sun',
    requires: [ENTITIES.scriptWakeLight],
    relevance: (c) => (c.moment === 'nacht' ? 60 : 0),
    detail: () => 'Slaapkamer om 6:45',
    run: (h) => turnOn(h, ENTITIES.scriptWakeLight),
  },
];

// ---------------------------------------------------------------- selection

export interface QuickActionSelection {
  suggested?: QuickAction;
  quick: QuickAction[];
}

export function buildContext(now: Date, states: HassEntities): ActionContext {
  return { now, moment: momentOf(now), weekend: isWeekend(now), states };
}

/** Picks the one suggested routine and the four most relevant quick actions. */
export function selectQuickActions(ctx: ActionContext, max = 4): QuickActionSelection {
  const available = ACTIONS.filter((a) => a.requires.every((id) => id in ctx.states))
    .map((a) => ({ a, score: a.relevance(ctx) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a);

  const suggested = available.find((a) => a.suggestable);
  const quick = available.filter((a) => a !== suggested && !a.suggestable).slice(0, max);
  return { suggested, quick };
}
