// DEV ONLY. A fake `hass` with sample entities, used by `npm run dev` when
// .env.local has no token. States start out matching the current moment of day. callService mutates the fake states so tapping a
// card visibly does something.
import type { HassEntities, HassEntity, HassServiceTarget } from 'home-assistant-js-websocket';
import { MEDIA } from '../config/media';

const SONOS = MEDIA.sonos.entity;
const CHROMECAST = MEDIA.chromecast.entity;
const STATIONS = MEDIA.sonos.stations;
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

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

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
    // The status line's lights (src/config/status.ts), also listed in "Wat staat aan" (docs/design/whats-on).
    entity('light.huecupboard', 'on', { friendly_name: 'CB3', brightness: 153, supported_color_modes: ['brightness'], color_mode: 'brightness' }),
    entity('light.centris', 'on', { friendly_name: 'Centris', supported_color_modes: ['onoff'], color_mode: 'onoff' }),
    // Snel on Thuis (src/config/shortcuts.ts, docs/design/snel-list).
    // A scene's state is when it last ran; 'unknown' if it never has.
    entity('scene.pre_sleep', '2026-10-24T19:12:03+00:00', { friendly_name: 'Pré slaapje' }),
    entity('script.garage_door_impuls', 'off', { friendly_name: 'Garage door impuls' }),
    entity('scene.living_mood_lighting', 'unknown', { friendly_name: 'Sfeer' }),
    // Verbruik (docs/design/verbruik); the IDs are the real ones from src/config/statistics.ts.
    entity('sensor.p1_meter_power', '196', { unit_of_measurement: 'W', device_class: 'power', state_class: 'measurement' }),
    entity('sensor.p1_meter_energy_consumption_daily', '8.13', { unit_of_measurement: 'kWh', state_class: 'total_increasing' }),
    entity('sensor.p1_meter_energy_production_daily', '1.24', { unit_of_measurement: 'kWh', state_class: 'total_increasing' }),
    entity('sensor.garage_water_meter_consumption_daily', '0.102', { unit_of_measurement: 'm³', state_class: 'total_increasing' }),
    entity('sensor.gas_meter_consumption_daily', '2.78', { unit_of_measurement: 'm³', state_class: 'total_increasing' }),
    // Jaqueline, a Worx Landroid (docs/design/lawn-mower); the IDs are the real ones from src/config/rooms.ts.
    entity('lawn_mower.jeroen_dg2_gmail_com_jaqueline', 'docked', { friendly_name: 'Jaqueline 👸🏼', supported_features: 7 }),
    entity('sensor.jeroen_dg2_gmail_com_jaqueline_battery', '100', { unit_of_measurement: '%', device_class: 'battery' }),
    entity('sensor.jeroen_dg2_gmail_com_jaqueline_battery_temperature', '16.5', { unit_of_measurement: '°C', device_class: 'temperature' }),
    entity('binary_sensor.jeroen_dg2_gmail_com_jaqueline_charging', 'off', { device_class: 'battery_charging' }),
    entity('binary_sensor.jeroen_dg2_gmail_com_jaqueline_rain_sensor', 'off', { device_class: 'moisture' }),
    entity('binary_sensor.jeroen_dg2_gmail_com_jaqueline_mqtt', 'on', { device_class: 'connectivity' }),
    entity('sensor.jeroen_dg2_gmail_com_jaqueline_error', 'no_error', { device_class: 'enum' }),
    entity('sensor.jeroen_dg2_gmail_com_jaqueline_blade_runtime_since_reset', '47.9166666666667', { unit_of_measurement: 'h' }),
    entity('sensor.jeroen_dg2_gmail_com_jaqueline_distance_driven_total', '49.345', { unit_of_measurement: 'km' }),
    entity('select.jeroen_dg2_gmail_com_jaqueline_zone', 'unknown', { options: ['1', '2', '3'] }),
    // A MELCloud airco (docs/design/airco-sheet); the ID is the real one from src/config/rooms.ts.
    entity('climate.bedroom_marielou_airco', 'heat', {
      friendly_name: 'Airco',
      hvac_modes: ['off', 'heat', 'cool', 'auto', 'dry', 'fan_only'],
      current_temperature: 23,
      temperature: 23,
      min_temp: 10,
      max_temp: 31,
      fan_modes: ['auto', 'speed_1', 'speed_2', 'speed_3', 'speed_4', 'speed_5'],
      fan_mode: 'speed_1',
      swing_modes: ['auto', 'swing', 'position_1', 'position_2', 'position_3', 'position_4', 'position_5'],
      swing_mode: 'position_1',
      swing_horizontal_modes: ['auto', 'swing', 'left', 'left_centre', 'centre', 'right_centre', 'right'],
      swing_horizontal_mode: 'left',
      supported_features: 937,
    }),
    entity('switch.koffiemachine', 'off', { friendly_name: 'Koffiemachine' }),
    entity('cover.rolluiken', 'closed', { friendly_name: 'Rolluiken' }),
    entity('lock.voordeur', 'locked', { friendly_name: 'Voordeur' }),
    // Warnings (src/config/attention.ts): the garage has been open for 25 min.
    { ...entity('sensor.garage_door_state_classification', 'open', { friendly_name: 'Garage door' }), last_changed: minutesAgo(25) },
    entity('update.irpi_admin_version', 'on', { friendly_name: 'Immich version', title: 'Immich', installed_version: 'v3.3.1', latest_version: 'v3.3.4' }),
    entity('sensor.auto_batterij', '62', { unit_of_measurement: '%' }),
    entity('switch.auto_laden', 'off', { friendly_name: 'Auto laden' }),
    entity('media_player.woonkamer', 'idle', { friendly_name: 'Woonkamer' }),
    // Today's birthdays (src/config/status.ts BIRTHDAYS): the state is the number of open items.
    entity('todo.birthdays_today', '2', { friendly_name: 'Birthdays today' }),
    // Cara's water fountain (src/config/status.ts NOW): on, so the status band shows her drinking.
    entity('switch.0x94a081fffe562fad', 'on', { friendly_name: 'Drinkfontein Cara' }),
    // The media card uses the IDs from src/config/media.ts, so mock those.
    entity(SONOS, 'idle', { friendly_name: 'Woonkamer', volume_level: 0.3, supported_features: 1 | 4 | 16 | 32 | 4096 }),
    entity(CHROMECAST, 'playing', {
      friendly_name: 'Tv woonkamer',
      app_name: 'Netflix',
      media_title: 'Planet Earth III',
      media_duration: 3110,
      media_position: 1928,
      media_position_updated_at: new Date().toISOString(),
      volume_level: 0.25,
      supported_features: 1 | 2 | 4 | 4096,
    }),
    entity('scene.ochtend', 'scening'),
    entity('scene.weekendochtend', 'scening'),
    entity('scene.gezellige_avond', 'scening'),
    entity('scene.film', 'scening'),
    ...STATIONS.map(({ script }) => entity(script, 'off')),
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

  // Fake stream scripts: like the real ones, the Sonos starts a moment later,
  // playing the station's bare stream URL (no station name, like Icecast).
  const STREAMS: Record<string, string> = Object.fromEntries(STATIONS.map(({ script, stream }) => [script, stream]));
  const startStream = (id: string) =>
    setTimeout(() => {
      // A live stream: no duration, so no progress bar.
      set(SONOS, 'playing', {
        media_channel: null,
        media_artist: null,
        media_title: null,
        media_content_id: STREAMS[id],
        media_duration: null,
        media_position: null,
      });
      emit();
    }, 1500);

  /** Current position of a playing player, like HA would report it on pause. */
  const positionNow = (id: string) => {
    const a = states[id]?.attributes ?? {};
    const pos = Number(a.media_position) || 0;
    if (states[id]?.state !== 'playing' || !a.media_position_updated_at) return pos;
    return pos + (Date.now() - Date.parse(String(a.media_position_updated_at))) / 1000;
  };
  const stamp = () => new Date().toISOString();

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
      } else if (service === 'turn_on' && domain === 'climate') set(id, 'heat');
      else if (service === 'turn_on') ROUTINES[id] ? ROUTINES[id]() : set(id, 'on');
      else if (service === 'turn_off') set(id, 'off');
      else if (service === 'toggle') set(id, current === 'on' ? 'off' : 'on');
      else if (service === 'open_cover') set(id, 'open');
      else if (service === 'close_cover') set(id, 'closed');
      else if (service === 'lock') set(id, 'locked');
      else if (service === 'unlock') set(id, 'unlocked');
      else if (service === 'set_temperature') set(id, current === 'off' ? 'heat' : current, { temperature: data?.temperature });
      else if (service === 'set_hvac_mode') set(id, String(data?.hvac_mode));
      else if (service === 'set_fan_mode') set(id, current, { fan_mode: data?.fan_mode });
      else if (service === 'set_swing_mode') set(id, current, { swing_mode: data?.swing_mode });
      else if (service === 'set_swing_horizontal_mode') set(id, current, { swing_horizontal_mode: data?.swing_horizontal_mode });
      else if (service === 'start_mowing') set(id, 'mowing');
      else if (service === 'pause') set(id, 'paused');
      else if (service === 'dock') set(id, 'returning');
      else if (service === 'select_option') set(id, String(data?.option));
      else if (service === 'media_play_pause')
        set(id, current === 'playing' ? 'paused' : 'playing', { media_position: positionNow(id), media_position_updated_at: stamp() });
      else if (service === 'media_seek') set(id, current, { media_position: data?.seek_position, media_position_updated_at: stamp() });
      else if (service === 'volume_set') set(id, current, { volume_level: data?.volume_level });
      else if (service === 'media_stop') set(id, 'idle', { media_title: null, media_duration: null, media_position: null });
    }
    emit();
  };

  // The 6 days before today per daily sensor (docs/design/verbruik), oldest first.
  const DAILY_TOTALS: Record<string, number[]> = {
    'sensor.p1_meter_energy_consumption_daily': [9.4, 8.8, 10.2, 7.9, 9.1, 11.3],
    'sensor.p1_meter_energy_production_daily': [3.1, 4.6, 1.2, 0.8, 2.9, 5.1],
    'sensor.garage_water_meter_consumption_daily': [0.131, 0.118, 0.152, 0.097, 0.141, 0.126],
    'sensor.gas_meter_consumption_daily': [2.41, 2.9, 3.1, 2.2, 2.6, 3.4],
  };

  const callWS = async <T,>(msg: { type: string; [key: string]: unknown }) => {
    console.info('[mock] callWS', msg);
    if (msg.type === 'recorder/statistics_during_period') {
      const statisticIds = msg.statistic_ids as string[];
      const dayLength = 24 * 3600_000;
      return Object.fromEntries(
        statisticIds.map((statisticId) => [
          statisticId,
          (DAILY_TOTALS[statisticId] ?? []).map((change, dayIndex) => ({ start: Date.now() - (6 - dayIndex) * dayLength, change })),
        ]),
      ) as T;
    }
    if (msg.type === 'recorder/statistic_during_period') return { max: 2400 } as T;
    if (msg.type === 'todo/item/list' && msg.entity_id === 'todo.birthdays_today') {
      return { items: [{ uid: 'birthday-1', summary: 'Jan', status: 'needs_action' }, { uid: 'birthday-2', summary: 'An', status: 'needs_action' }] } as T;
    }
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
