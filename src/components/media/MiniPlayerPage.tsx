import type { HassEntity } from 'home-assistant-js-websocket';
import { useMediaPlayer } from '../../hooks/useMediaPlayer';
import { castApp, nowPlaying, type MediaDevice } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { Icon } from '../Icon';

interface Props {
  hass: HomeAssistant;
  device: MediaDevice;
  player: HassEntity;
  /** Tapping the picture or the title opens the expanded player. */
  onOpen(): void;
}

/**
 * One page of the mini player (docs/design/media-dock), only while the device
 * plays: picture, title, pause, and a thin progress line when there's a length.
 */
export function MiniPlayerPage({ hass, device, player, onOpen }: Props) {
  const media = useMediaPlayer(hass, player);
  const { title, subtitle } = device === 'sonos' ? nowPlaying(player) : castTitles(player);
  const progressFraction = media.progress ? media.progress.position / media.progress.duration : undefined;

  return (
    <section className="mini-player" aria-label={device === 'sonos' ? 'Sonos' : 'TV'}>
      <button type="button" className="mini-player__open" onClick={onOpen} aria-label={`${title} openen`}>
        {device === 'chromecast' && media.image ? (
          <img className="mini-player__thumb" src={media.image} alt="" />
        ) : (
          // No video image: the device's colour fade, with album art square in the middle.
          <span className={`mini-player__thumb media-fade media-fade--${device === 'sonos' ? 'sonos' : 'cast'}`} aria-hidden>
            {media.image && <img src={media.image} alt="" />}
          </span>
        )}
        <span className="mini-player__text">
          <span className="mini-player__title">{title}</span>
          {subtitle && <span className="mini-player__subtitle">{subtitle}</span>}
        </span>
      </button>
      <button type="button" className="round-button" aria-label={media.playing ? 'Pauzeren' : 'Afspelen'} onClick={media.playPause}>
        <Icon name={media.playing ? 'pause' : 'play'} />
      </button>
      {progressFraction !== undefined && (
        <span className="mini-player__progress" aria-hidden>
          <i style={{ width: `${progressFraction * 100}%` }} />
        </span>
      )}
    </section>
  );
}

/** The cast title, with the app's name ("Netflix") below it. */
function castTitles(cast: HassEntity) {
  const title = String(cast.attributes.media_title ?? cast.attributes.friendly_name ?? 'TV');

  return { title, subtitle: castApp(cast) ?? '' };
}
