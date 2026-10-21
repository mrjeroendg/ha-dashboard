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
    // supported_color_modes like real lights: dimmable, colour, or on/off only.
    entity('light.keuken', 'off', { friendly_name: 'Keuken', supported_color_modes: ['brightness'] }),
    entity('light.gang', 'off', { friendly_name: 'Gang', supported_color_modes: ['onoff'] }),
    entity('light.woonkamer', 'off', {
      friendly_name: 'Woonkamer',
      supported_color_modes: ['color_temp', 'xy'],
      min_color_temp_kelvin: 2000,
      max_color_temp_kelvin: 6500,
      color_mode: 'color_temp',
      color_temp_kelvin: 2700,
      rgb_color: [255, 167, 87],
    }),
    entity('light.eettafel', 'off', { friendly_name: 'Eettafel', supported_color_modes: ['brightness'] }),
    entity('light.slaapkamer', 'off', { friendly_name: 'Slaapkamer', supported_color_modes: ['hs'], color_mode: 'hs', rgb_color: [255, 147, 41] }),
    entity('light.bureau', 'off', { friendly_name: 'Bureau', supported_color_modes: ['onoff'] }),
    entity('binary_sensor.raam_badkamer', 'off', { friendly_name: 'Raam badkamer', device_class: 'window' }),
    entity('sensor.woonkamer_temperatuur', '19.5', { unit_of_measurement: '°C', device_class: 'temperature' }),
    entity('sensor.slaapkamer_temperatuur', '18.2', { unit_of_measurement: '°C', device_class: 'temperature', friendly_name: 'Temperatuur' }),
    entity('sensor.badkamer_temperatuur', '20.1', { unit_of_measurement: '°C', device_class: 'temperature' }),
    entity('sensor.badkamer_vochtigheid', '64', { unit_of_measurement: '%', device_class: 'humidity' }),
    entity('climate.woonkamer', 'heat', { current_temperature: 19.5, temperature: 19 }),
    entity('switch.koffiemachine', 'off', { friendly_name: 'Koffiemachine' }),
    entity('cover.rolluiken', 'closed', { friendly_name: 'Rolluiken' }),
    entity('lock.voordeur', 'locked', { friendly_name: 'Voordeur' }),
    entity('sensor.auto_batterij', '62', { unit_of_measurement: '%' }),
    entity('switch.auto_laden', 'off', { friendly_name: 'Auto laden' }),
    entity('media_player.woonkamer', 'idle', { friendly_name: 'Woonkamer' }),
    entity('media_player.chromecast', 'off', { friendly_name: 'Tv woonkamer' }),
    entity('scene.ochtend', 'scening'),
    entity('scene.weekendochtend', 'scening'),
    entity('scene.gezellige_avond', 'scening'),
    entity('scene.film', 'scening'),
    entity('script.sonos_stubru', 'off', { friendly_name: 'StuBru' }),
    entity('script.sonos_klara', 'off', { friendly_name: 'Klara' }),
    entity('script.sonos_lofi', 'off', { friendly_name: 'Lo-fi' }),
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

  // Last brightness per light, so turning it back on restores it (like HA).
  const lastBrightness: Record<string, number> = {};

  const set = (id: string, state: string, attrs: Attrs = {}) => {
    const prev = states[id];
    if (!prev) return;
    const next: Attrs = { ...prev.attributes, ...attrs };

    // Like HA: a dimmable light only reports brightness while it's on.
    const modes = prev.attributes.supported_color_modes as string[] | undefined;
    if (id.startsWith('light.') && modes && !modes.includes('onoff')) {
      if (state === 'on') next.brightness = attrs.brightness ?? lastBrightness[id] ?? 204;
      else next.brightness = null;
      if (typeof next.brightness === 'number') lastBrightness[id] = next.brightness;
    }

    states = {
      ...states,
      [id]: { ...prev, state, attributes: next, last_changed: new Date().toISOString() },
    };
  };

  const targets = (target?: HassServiceTarget, data?: Attrs): string[] => {
    const ids = target?.entity_id ?? data?.entity_id;
    return ids === undefined ? [] : Array.isArray(ids) ? ids : [String(ids)];
  };

  // Fake stream scripts: like the real ones, the Sonos starts a moment later.
  const STREAMS: Record<string, Attrs> = {
    'script.sonos_stubru': { media_channel: 'Studio Brussel', media_artist: 'Arctic Monkeys', media_title: 'Do I Wanna Know?' },
    'script.sonos_klara': { media_channel: 'Klara', media_artist: 'Bach', media_title: 'Goldbergvariaties' },
    'script.sonos_lofi': { media_channel: 'Lo-fi Beats', media_artist: 'Lofi Girl', media_title: 'Snowman' },
  };
  const startStream = (id: string) =>
    setTimeout(() => {
      set('media_player.woonkamer', 'playing', { ...STREAMS[id], media_content_id: id });
      emit();
    }, 1500);

  // What the fake scenes/scripts do.
  const ROUTINES: Record<string, () => void> = {
    ...Object.fromEntries(Object.keys(STREAMS).map((id) => [id, () => startStream(id)])),
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
      if (service === 'turn_on' && typeof data?.brightness_pct === 'number') {
        set(id, 'on', { brightness: Math.round((data.brightness_pct / 100) * 255) });
      } else if (service === 'turn_on' && Array.isArray(data?.rgb_color)) {
        const modes = states[id]?.attributes.supported_color_modes as string[];
        set(id, 'on', { color_mode: modes.find((m) => m !== 'color_temp'), rgb_color: data.rgb_color, color_temp_kelvin: null });
      } else if (service === 'turn_on' && typeof data?.color_temp_kelvin === 'number') {
        // Rough display color for the temperature, like HA reports rgb_color in color_temp mode.
        const k = data.color_temp_kelvin;
        const rgb = k < 3300 ? [255, 167, 87] : k < 5000 ? [255, 214, 170] : [235, 238, 255];
        set(id, 'on', { color_mode: 'color_temp', color_temp_kelvin: k, rgb_color: rgb });
      } else if (service === 'turn_on') ROUTINES[id] ? ROUTINES[id]() : set(id, 'on');
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
      hassUrl: (path = '') => path,
      callService,
      callWS,
    });

  for (const [id, value] of Object.entries(SCENARIOS[scenarioFor(new Date())])) {
    set(id, value);
    if (id === 'sensor.woonkamer_temperatuur') set('climate.woonkamer', 'heat', { current_temperature: Number(value) });
  }
  emit();
}
