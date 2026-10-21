/**
 * Mini media player on Thuis.
 *
 * - SONOS: the Sonos (group) media_player entity. Replace with your own ID.
 * - CHROMECAST: the Chromecast media_player from the Google Cast integration.
 *   Replace with your own ID; leave a non-existing ID to hide the page.
 * - STREAM_SCRIPTS: HA scripts that send a stream URL to the Sonos. All the
 *   logic stays in HA; the dashboard only starts them. The button label is the
 *   script's name in HA (friendly_name). Scripts that don't exist are hidden.
 */
export const SONOS = 'media_player.living_room';

export const CHROMECAST = 'media_player.living_living';

export const STREAM_SCRIPTS: string[] = [
  'script.speel_radio1_op_chromecast',
  'script.speel_studiobrussel_op_chromecast',
  'script.play_radio_1_on_sonos_duplicate'
];
