import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';

export interface StreamButton {
  script: string;
  label: string;
}

/** Configured stream scripts that exist in HA, labelled with their HA name. */
export function streamButtons(scripts: string[], states: HassEntities): StreamButton[] {
  return scripts
    .filter((id) => id in states)
    .map((id) => ({ script: id, label: String(states[id].attributes.friendly_name ?? id.split('.')[1]) }));
}

/** "Playing" includes paused: there is something loaded you can resume. */
export function hasMedia(player?: HassEntity): boolean {
  return player?.state === 'playing' || player?.state === 'paused';
}

/**
 * Title and subtitle for the mini player. For radio, Sonos reports the station
 * as media_channel and the current track in media_artist/media_title.
 */
export function nowPlaying(player: HassEntity): { title: string; subtitle: string } {
  const a = player.attributes;
  const channel = a.media_channel ? String(a.media_channel) : undefined;
  const title = a.media_title ? String(a.media_title) : undefined;
  const artist = a.media_artist ? String(a.media_artist) : undefined;

  if (channel) {
    return { title: channel, subtitle: [artist, title].filter(Boolean).join(' – ') };
  }
  return {
    title: title ?? String(a.friendly_name ?? 'Sonos'),
    subtitle: artist ?? '',
  };
}
