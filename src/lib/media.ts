import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { STREAM_NAMES } from '../config/media';

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
  // A bare stream URL has no station name: take it from STREAM_NAMES.
  const channel = a.media_channel ? String(a.media_channel) : STREAM_NAMES[String(a.media_content_id)];
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

/**
 * The cast app's name ("VRT MAX", "Netflix"), shown under the title. The
 * generic Cast receiver name says nothing, so it's left out.
 */
export function castApp(cast: HassEntity): string | undefined {
  const app = cast.attributes.app_name ? String(cast.attributes.app_name) : undefined;
  return app && app !== 'Default Media Receiver' ? app : undefined;
}

/** States in which the Chromecast is actually casting something. */
const CASTING = new Set(['playing', 'paused', 'buffering']);

/** Casting, and not just showing the ambient screen ("Backdrop"). */
export function isCasting(cast?: HassEntity): boolean {
  return !!cast && CASTING.has(cast.state) && cast.attributes.app_name !== 'Backdrop';
}

/**
 * Current playback position in seconds, extrapolated while playing (HA only
 * updates media_position on changes). Undefined when there is no (positive)
 * duration, e.g. live TV.
 */
export function progress(player: HassEntity, now: number): { position: number; duration: number } | undefined {
  const a = player.attributes;
  const duration = Number(a.media_duration);
  // Live streams have no duration; Cast reports that as -1 instead of empty.
  if (!Number.isFinite(duration) || duration <= 0) return undefined;

  let position = Number(a.media_position) || 0;
  if (player.state === 'playing' && a.media_position_updated_at) {
    position += (now - Date.parse(String(a.media_position_updated_at))) / 1000;
  }
  return { position: Math.min(Math.max(position, 0), duration), duration };
}

/** 32:10, 1:02:05 */
export function formatDuration(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Bits of a media_player's `supported_features` (HA MediaPlayerEntityFeature). */
export const FEATURE = {
  PAUSE: 1,
  SEEK: 2,
  VOLUME_SET: 4,
  PREVIOUS_TRACK: 16,
  NEXT_TRACK: 32,
  STOP: 4096,
} as const;

export function supports(player: HassEntity, feature: number): boolean {
  return (Number(player.attributes.supported_features ?? 0) & feature) !== 0;
}

/** Absolute URL of the player's current image, if it has one. */
export function imageUrl(hass: { hassUrl?(path?: string): string }, player: HassEntity): string | undefined {
  const picture = player.attributes.entity_picture ? String(player.attributes.entity_picture) : undefined;
  return picture && hass.hassUrl ? hass.hassUrl(picture) : picture;
}

/** Subtitle for the expanded player: current track for radio, else artist · album. */
export function longSubtitle(player: HassEntity): string {
  const a = player.attributes;
  const parts = a.media_channel
    ? [a.media_artist, a.media_title].filter(Boolean).join(' – ')
    : [a.media_artist, a.media_album_name].filter(Boolean).join(' · ');
  return String(parts);
}
