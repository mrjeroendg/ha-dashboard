import { useEffect, useState } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { formatDuration, isCasting, progress } from '../lib/media';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
  player: HassEntity;
}

/** Re-renders every second while `active`, for the progress bar. */
function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

/** Chromecast page of the mini player. Always present, also when idle. */
export function CastPage({ hass, player }: Props) {
  const casting = isCasting(player);
  const playing = player.state === 'playing';
  const now = useTicker(casting && playing);

  const picture = casting && player.attributes.entity_picture ? String(player.attributes.entity_picture) : undefined;
  const src = picture && hass.hassUrl ? hass.hassUrl(picture) : picture;
  const p = casting ? progress(player, now) : undefined;
  const name = String(player.attributes.friendly_name ?? 'Chromecast');

  return (
    <section className={`mini-player cast-page${casting ? '' : ' is-idle'}`} aria-label="Chromecast">
      <div className="mini-player__top">
        {src ? (
          <img className="cast-page__thumb" src={src} alt="" />
        ) : (
          // No image from the app (or nothing casting): the soft colour fade.
          <span className="cast-page__thumb cast-page__thumb--fade" aria-hidden />
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
        {casting && (
          <button
            type="button"
            className="round-button"
            aria-label={playing ? 'Pauzeren' : 'Afspelen'}
            onClick={() => hass.callService('media_player', 'media_play_pause', {}, { entity_id: player.entity_id })}
          >
            <Icon name={playing ? 'pause' : 'play'} />
          </button>
        )}
      </div>

      <div className="cast-page__progress">
        {casting && !p ? (
          <span className="live-pill">Live</span>
        ) : (
          <>
            <span>{p ? formatDuration(p.position) : ''}</span>
            <span className="cast-page__track">
              <i style={{ width: p ? `${(p.position / p.duration) * 100}%` : '0%' }} />
            </span>
            <span>{p ? `−${formatDuration(p.duration - p.position)}` : ''}</span>
          </>
        )}
      </div>
    </section>
  );
}
