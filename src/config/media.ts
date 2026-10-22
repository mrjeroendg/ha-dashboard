/**
 * Mini media player on Thuis.
 *
 * - SONOS: the Sonos (group) media_player entity. Replace with your own ID.
 * - CHROMECAST: the Chromecast media_player from the Google Cast integration.
 *   Replace with your own ID; leave a non-existing ID to hide the page.
 * - STREAM_SCRIPTS: HA scripts that send a stream URL to the Sonos. All the
 *   logic stays in HA; the dashboard only starts them. The button label is the
 *   script's name in HA (friendly_name). Scripts that don't exist are hidden.
 * - CAST_APPS: buttons on the Chromecast page while nothing is casting (up to
 *   3). A tap opens the app on the iPhone through its URL scheme; from there
 *   you cast to the TV yourself. `color` is the app's house colour; the colour
 *   circle is built from it. Without one, they go by position: red, teal, gold.
 */
export const SONOS = 'media_player.living_room';

export const CHROMECAST = 'media_player.living_living';

export const STREAM_SCRIPTS: string[] = [
  'script.speel_radio1_op_chromecast',
  'script.speel_studiobrussel_op_chromecast',
  'script.play_radio_1_on_sonos_duplicate'
];

export interface CastApp {
  name: string;
  /** The app's URL scheme, e.g. 'nflx://' for Netflix. */
  url: string;
  /** House colour as hex, e.g. '#e50914'. */
  color?: string;
}

export const CAST_APPS: CastApp[] = [
  { name: 'Netflix', url: 'nflx://', color: '#e50914' },
  { name: 'VRT MAX', url: 'vrtmax://', color: '#1f1f1f' },
  { name: 'VTM GO', url: 'vtmgo://', color: '#ee7f01' },
];
