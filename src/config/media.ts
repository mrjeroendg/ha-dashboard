import type { DotColor } from '../lib/dots';

/**
 * Mini media player on Thuis.
 *
 * - SONOS: the Sonos (group) media_player entity. Replace with your own ID.
 * - CHROMECAST: the Chromecast media_player from the Google Cast integration.
 *   Replace with your own ID; leave a non-existing ID to hide the page.
 * - STREAM_SCRIPTS: HA scripts that send a stream URL to the Sonos. All the
 *   logic stays in HA; the dashboard only starts them. The button label is the
 *   script's name in HA (friendly_name). Scripts that don't exist are hidden.
 *   `color` works like for CAST_APPS (the station's colours, from its player).
 * - CAST_APPS: buttons on the Chromecast page while nothing is casting (up to
 *   3). A tap opens the app on the iPhone through its URL scheme; from there
 *   you cast to the TV yourself. `color` is the app's house colour, or a list
 *   of colours for an icon with a gradient (top left to bottom right); the
 *   colour circle is built from it. Without one: red, teal, gold by position.
 */
export const SONOS = 'media_player.living_room';

export const CHROMECAST = 'media_player.living_living';

/** Colours from the VRT players, with the coral of their play button. */
const RADIO_1: DotColor = ['#ff4942', '#0068d8', '#002a66'];
const STUBRU: DotColor = ['#ff4942', '#7e31aa', '#331a5c'];
/** Ready for a Klara script: { script: 'script.…', color: KLARA }. */
export const KLARA: DotColor = ['#ff4942', '#c0b06c', '#434540'];

export interface StreamScript {
  script: string;
  color?: DotColor;
}

export const STREAM_SCRIPTS: StreamScript[] = [
  { script: 'script.speel_radio1_op_chromecast', color: RADIO_1 },
  { script: 'script.speel_studiobrussel_op_chromecast', color: STUBRU },
  { script: 'script.play_radio_1_on_sonos_duplicate', color: RADIO_1 },
];

/**
 * Station names for plain stream URLs. A bare stream (e.g. an Icecast mp3)
 * gives the Sonos no station name, so the card shows this name when the
 * Sonos's media_content_id is exactly one of these URLs.
 */
export const STREAM_NAMES: Record<string, string> = {
  'http://icecast.vrtcdn.be/radio1-high.mp3': 'Radio 1',
  'http://icecast.vrtcdn.be/stubru-high.mp3': 'Studio Brussel',
};

export interface CastApp {
  name: string;
  /** The app's URL scheme, e.g. 'nflx://' for Netflix. */
  url: string;
  /** House colour as hex ('#e50914'), or several for a gradient. */
  color?: DotColor;
}

export const CAST_APPS: CastApp[] = [
  { name: 'Netflix', url: 'nflx://', color: ['#f0323b', '#e50914', '#141414'] },
  { name: 'VRT MAX', url: 'vrtmax://', color: ['#ff4f55', '#f5333a', '#f5333a', '#1b1d52'] },
  { name: 'VTM GO', url: 'vtmgo://', color: ['#e555d9', '#fa077e', '#f73849', '#ff8518'] },
];
