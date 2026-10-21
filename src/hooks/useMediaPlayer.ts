import type { HassEntity } from 'home-assistant-js-websocket';
import { FEATURE, imageUrl, progress, supports } from '../lib/media';
import type { HomeAssistant } from '../types/hass';
import { useTicker } from './useTicker';

/**
 * Everything the small and the large player share for one media_player:
 * what's playing, where it is, what it can do, and the actions. The
 * components only decide what it looks like.
 */
export function useMediaPlayer(hass: HomeAssistant, player: HassEntity) {
  const a = player.attributes;
  const playing = player.state === 'playing';
  const now = useTicker(playing && !!a.media_duration);
  const position = progress(player, now);

  const call = (service: string, data: Record<string, unknown> = {}) =>
    hass.callService('media_player', service, data, { entity_id: player.entity_id });

  return {
    playing,
    image: imageUrl(hass, player),
    /** Undefined when there is no duration: live stream or live TV. */
    progress: position,
    volume: typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : undefined,
    can: {
      // Skipping only makes sense in something with a length, not in a live stream.
      previous: !!position && supports(player, FEATURE.PREVIOUS_TRACK),
      next: !!position && supports(player, FEATURE.NEXT_TRACK),
      seek: !!position && supports(player, FEATURE.SEEK),
      volume: supports(player, FEATURE.VOLUME_SET),
      stop: supports(player, FEATURE.STOP),
    },
    playPause: () => call('media_play_pause'),
    previous: () => call('media_previous_track'),
    next: () => call('media_next_track'),
    /** Jump `delta` seconds forward (positive) or back (negative). */
    seekBy: (delta: number) =>
      position
        ? call('media_seek', { seek_position: Math.min(Math.max(position.position + delta, 0), position.duration) })
        : Promise.resolve(),
    setVolume: (pct: number) => call('volume_set', { volume_level: pct / 100 }),
    stop: () => call('media_stop'),
  };
}
