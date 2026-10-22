import type { HassEntity } from 'home-assistant-js-websocket';
import { CAST_APPS } from '../../config/media';
import { useMediaPlayer } from '../../hooks/useMediaPlayer';
import { dotFor } from '../../lib/dots';
import { haptic } from '../../lib/haptic';
import { castApp, formatDuration, isCasting } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { Icon } from '../Icon';
import { LivePill, ProgressTrack } from './parts/Progress';

/** Fallback colour circles for apps without a colour, by position. */
const DOTS = [
  'radial-gradient(circle at 38% 32%, #ff8a80, transparent 55%), linear-gradient(150deg, #e5383b, #5c0f14)',
  'radial-gradient(circle at 40% 35%, #9fe3d9, transparent 55%), linear-gradient(140deg, #2fa39a, #173d3f)',
  'radial-gradient(circle at 40% 32%, #ffe0a3, transparent 55%), linear-gradient(140deg, #e7a83e, #6b3d1e)',
];

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
  // App buttons only while nothing is casting (docs/design/media-card).
  const apps = casting ? [] : CAST_APPS.slice(0, 3);

  return (
    <section
      className={`mini-player cast-page${casting ? '' : ' is-idle'}${apps.length ? ' has-apps' : ''}`}
      aria-label="Chromecast"
    >
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
              <>
                <span className="cast-page__title">{String(player.attributes.media_title ?? name)}</span>
                {castApp(player) && <span className="mini-player__subtitle">{castApp(player)}</span>}
              </>
            ) : (
              <>
                {/* Fixed, like "Muziek op Sonos" on the Sonos page. */}
                <span className="mini-player__title">TV op Chromecast</span>
                <span className="mini-player__subtitle">
                  {apps.length ? 'Kies een app om te openen' : 'Niets aan het casten'}
                </span>
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

      {apps.length > 0 ? (
        <div className="mini-player__streams">
          {apps.map((app, i) => (
            <button
              key={app.url}
              type="button"
              className="stream-pill"
              onClick={() => {
                haptic('light');
                // Same as HA's own "url" tap action: iOS hands the link to the app.
                window.open(app.url);
              }}
            >
              <span className="stream-pill__logo" style={{ background: app.color ? dotFor(app.color) : DOTS[i % DOTS.length] }} aria-hidden />
              <span className="stream-pill__label">{app.name}</span>
            </button>
          ))}
        </div>
      ) : (
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
      )}
    </section>
  );
}
