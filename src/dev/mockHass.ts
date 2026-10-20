// DEV ONLY. A fake `hass` with sample entities, used by `npm run dev` when
// .env.local has no token. States start out matching the current moment of day. callService mutates the fake states so tapping a
// card visibly does something.
import type { HassEntities, HassEntity, HassServiceTarget } from 'home-assistant-js-websocket';
import { isWeekend, momentOf, type Moment } from '../lib/moment';
import type { HomeAssistant } from '../types/hass';

type Attrs = Record<string, unknown>;

const entity = (entity_id: string, state: string, attributes: Attrs = {}): HassEntity => ({
  entity_id,
  state,
  attributes,
  last_changed: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  context: { id: 'mock', user_id: null, parent_id: null },
});

const DOWNSTAIRS = ['light.keuken', 'light.gang', 'light.woonkamer', 'light.eettafel'];

function baseStates(): HassEntities {
  const list = [
    entity('person.jeroen', 'home', { friendly_name: 'Jeroen' }),
    entity('person.an', 'home', { friendly_name: 'An' }),
    entity('light.keuken', 'off', { friendly_name: 'Keuken' }),
    entity('light.gang', 'off', { friendly_name: 'Gang' }),
    entity('light.woonkamer', 'off', { friendly_name: 'Woonkamer' }),
    entity('light.eettafel', 'off', { friendly_name: 'Eettafel' }),
    entity('light.slaapkamer', 'off', { friendly_name: 'Slaapkamer' }),
    entity('light.bureau', 'off', { friendly_name: 'Bureau' }),
    entity('binary_sensor.raam_badkamer', 'off', { friendly_name: 'Raam badkamer', device_class: 'window' }),
    entity('sensor.woonkamer_temperatuur', '19.5', { unit_of_measurement: '°C' }),
    entity('climate.woonkamer', 'heat', { current_temperature: 19.5, temperature: 19 }),
    entity('switch.koffiemachine', 'off', { friendly_name: 'Koffiemachine' }),
    entity('cover.rolluiken', 'closed', { friendly_name: 'Rolluiken' }),
    entity('lock.voordeur', 'locked', { friendly_name: 'Voordeur' }),
    entity('sensor.auto_batterij', '62', { unit_of_measurement: '%' }),
    entity('switch.auto_laden', 'off', { friendly_name: 'Auto laden' }),
    entity('media_player.woonkamer', 'idle', { friendly_name: 'Woonkamer' }),
    entity('scene.ochtend', 'scening'),
    entity('scene.weekendochtend', 'scening'),
    entity('scene.gezellige_avond', 'scening'),
    entity('scene.film', 'scening'),
    entity('script.slaapwel', 'off'),
    entity('script.vertrekken', 'off'),
    entity('script.sproeier', 'off'),
    entity('script.wekker_licht', 'off'),
  ];
  return Object.fromEntries(list.map((e) => [e.entity_id, e]));
}

type Scenario = Moment | 'weekend';

/** Plausible fake states for the current moment of the day. */
const SCENARIOS: Record<Scenario, Record<string, string>> = {
  ochtend: { 'light.keuken': 'on', 'light.gang': 'on' },
  weekend: { 'light.keuken': 'on', 'cover.rolluiken': 'open', 'sensor.woonkamer_temperatuur': '20.5' },
  dag: { 'cover.rolluiken': 'open', 'light.bureau': 'on', 'sensor.woonkamer_temperatuur': '20.5' },
  avond: {
    'light.keuken': 'on',
    'light.woonkamer': 'on',
    'light.eettafel': 'on',
    'light.gang': 'on',
    'cover.rolluiken': 'open',
    'switch.auto_laden': 'on',
    'sensor.woonkamer_temperatuur': '21',
  },
  nacht: {
    'light.keuken': 'on',
    'light.woonkamer': 'on',
    'light.gang': 'on',
    'light.slaapkamer': 'on',
    'binary_sensor.raam_badkamer': 'on',
    'lock.voordeur': 'unlocked',
    'sensor.woonkamer_temperatuur': '20',
  },
};

function scenarioFor(date: Date): Scenario {
  const moment = momentOf(date);
  return isWeekend(date) && moment !== 'avond' && moment !== 'nacht' ? 'weekend' : moment;
}

export function createMockHass(onChange: (hass: HomeAssistant) => void) {
  let states = baseStates();

  const set = (id: string, state: string, attrs: Attrs = {}) => {
    const prev = states[id];
    if (!prev) return;
    states = {
      ...states,
      [id]: { ...prev, state, attributes: { ...prev.attributes, ...attrs }, last_changed: new Date().toISOString() },
    };
  };

  const targets = (target?: HassServiceTarget, data?: Attrs): string[] => {
    const ids = target?.entity_id ?? data?.entity_id;
    return ids === undefined ? [] : Array.isArray(ids) ? ids : [String(ids)];
  };

  // What the fake scenes/scripts do.
  const ROUTINES: Record<string, () => void> = {
    'scene.ochtend': () => {
      set('light.keuken', 'on');
      set('light.gang', 'on');
      set('cover.rolluiken', 'open');
    },
    'scene.weekendochtend': () => {
      set('light.keuken', 'on');
      set('media_player.woonkamer', 'playing');
    },
    'scene.gezellige_avond': () => {
      set('light.woonkamer', 'on');
      set('light.eettafel', 'on');
      set('light.keuken', 'off');
      set('cover.rolluiken', 'closed');
    },
    'scene.film': () => {
      DOWNSTAIRS.forEach((id) => set(id, 'off'));
      set('light.woonkamer', 'on');
      set('media_player.woonkamer', 'playing');
    },
    'script.slaapwel': () => {
      [...DOWNSTAIRS, 'light.slaapkamer'].forEach((id) => set(id, 'off'));
      set('lock.voordeur', 'locked');
      set('media_player.woonkamer', 'idle');
      set('climate.woonkamer', 'heat', { temperature: 17 });
    },
    'script.vertrekken': () => {
      [...DOWNSTAIRS, 'light.slaapkamer'].forEach((id) => set(id, 'off'));
      set('lock.voordeur', 'locked');
      set('person.jeroen', 'not_home');
      set('person.an', 'not_home');
    },
  };

  const callService: HomeAssistant['callService'] = async (domain, service, data, target) => {
    console.info(`[mock] ${domain}.${service}`, { ...data, ...target });
    await new Promise((r) => setTimeout(r, 450)); // feel like a network round trip

    for (const id of targets(target, data)) {
      const current = states[id]?.state;
      if (service === 'turn_on') ROUTINES[id] ? ROUTINES[id]() : set(id, 'on');
      else if (service === 'turn_off') set(id, 'off');
      else if (service === 'toggle') set(id, current === 'on' ? 'off' : 'on');
      else if (service === 'open_cover') set(id, 'open');
      else if (service === 'close_cover') set(id, 'closed');
      else if (service === 'lock') set(id, 'locked');
      else if (service === 'unlock') set(id, 'unlocked');
      else if (service === 'set_temperature') set(id, 'heat', { temperature: data?.temperature });
      else if (service === 'media_play_pause') set(id, current === 'playing' ? 'paused' : 'playing');
    }
    emit();
  };

  const callWS = async <T,>(msg: { type: string }) => {
    console.info('[mock] callWS', msg);
    return undefined as T;
  };

  const emit = () =>
    onChange({
      states,
      user: { id: 'mock', name: 'Jeroen', is_admin: true },
      language: 'nl',
      callService,
      callWS,
    });

  for (const [id, value] of Object.entries(SCENARIOS[scenarioFor(new Date())])) {
    set(id, value);
    if (id === 'sensor.woonkamer_temperatuur') set('climate.woonkamer', 'heat', { current_temperature: Number(value) });
  }
  emit();
}
