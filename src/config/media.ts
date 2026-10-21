/**
 * Mini media player on Thuis.
 *
 * - SONOS: the Sonos (group) media_player entity. Replace with your own ID.
 * - STREAM_SCRIPTS: HA scripts that send a stream URL to the Sonos. All the
 *   logic stays in HA; the dashboard only starts them. The button label is the
 *   script's name in HA (friendly_name). Scripts that don't exist are hidden.
 */
export const SONOS = 'media_player.woonkamer';

export const STREAM_SCRIPTS: string[] = [
  'script.sonos_stubru',
  'script.sonos_klara',
  'script.sonos_lofi',
];
