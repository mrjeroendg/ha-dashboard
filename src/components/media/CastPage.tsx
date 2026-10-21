import type { HassEntity } from 'home-assistant-js-websocket';
import { useMediaPlayer } from '../../hooks/useMediaPlayer';
import { formatDuration, isCasting } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { Icon } from '../Icon';
import { LivePill, ProgressTrack } from './parts/Progress';

interface Props {
  hass: HomeAssistant;
  player: HassEntity;
  /** Tapping the top row opens the expanded player. */
  onOpen(): void;
}

/** Chromecast page of the mini player. Always present, also when idle. */
export function CastPage({ hass, player, onOpen }: Props) {
  const media = useMediaPlayer(hass, player);
  const casting = isCasting(player);
  const p = casting ? media.progress : undefined;
  const name = String(player.attributes.friendly_name ?? 'Chromecast');
  const src = casting ? media.image : undefined;

  return (
    <section className={`mini-player cast-page${casting ? '' : ' is-idle'}`} aria-label="Chromecast">
      <div className="mini-player__top">
        <button type="button" className="mini-player__open" onClick={onOpen} aria-label={`${name} openen`}>
          {src ? (
            <img className="cast-page__thumb" src={src} alt="" />
          ) : (
            // No image from the app (or nothing casting): the soft colour fade.
            <span className="cast-page__thumb media-fade" aria-hidden />
          )}
          <span className="mini-player__text">
            {casting ? (
              <span className="cast-page__title">{String(player.attributes.media_title ?? name)}</span>
            ) : (
              <>
                <span className="mini-player__title">{name}</span>
                <span className="mini-player__subtitle">Niets aan het casten</span>
              </>
            )}
          </span>
        </button>
        {casting && (
          <button
            type="button"
            className="round-button"
            aria-label={media.playing ? 'Pauzeren' : 'Afspelen'}
            onClick={media.playPause}
          >
            <Icon name={media.playing ? 'pause' : 'play'} />
          </button>
        )}
      </div>

      <div className="cast-page__progress">
        {casting && !p ? (
          <LivePill />
        ) : (
          <>
            <span>{p ? formatDuration(p.position) : ''}</span>
            <ProgressTrack fraction={p ? p.position / p.duration : 0} />
            <span>{p ? `−${formatDuration(p.duration - p.position)}` : ''}</span>
          </>
        )}
      </div>
    </section>
  );
}
