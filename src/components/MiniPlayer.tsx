import { useEffect, useMemo, useRef, useState } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import { CHROMECAST, SONOS, STREAM_SCRIPTS } from '../config/media';
import { hasMedia, isCasting, nowPlaying, streamButtons } from '../lib/media';
import type { HomeAssistant } from '../types/hass';
import { CastPage } from './CastPage';
import { Icon } from './Icon';

/** How long to wait for the Sonos to start playing after a stream button. */
const START_TIMEOUT = 10_000;
const ERROR_VISIBLE = 3_000;

/** Decorative "logo" dots for the stream buttons, by position. */
const DOTS = [
  'radial-gradient(circle at 35% 30%, #f4d7a1, transparent 55%), linear-gradient(160deg, #e28a5c, #7a3b4b)',
  'radial-gradient(circle at 50% 40%, #f1e3c6, transparent 55%), linear-gradient(135deg, #b9a07a, #5d5246)',
  'radial-gradient(circle at 40% 35%, #c3b2f0, transparent 55%), linear-gradient(135deg, #7a64c9, #2f2a4f)',
  'radial-gradient(circle at 40% 35%, #a6d6a9, transparent 55%), linear-gradient(135deg, #5d9a6a, #2c3d33)',
];

interface Props {
  hass: HomeAssistant;
}

type Starting = { script: string; before: string } | null;

const mediaKey = (p?: HassEntity) =>
  p ? [p.state, p.attributes.media_channel, p.attributes.media_title, p.attributes.media_content_id].join('|') : '';

/**
 * Mini media player on Thuis (docs/design/media-card): one page per device,
 * Sonos and Chromecast, swiped horizontally and always snapping to a whole
 * page. The device that started playing most recently comes first.
 */
export function MiniPlayer({ hass }: Props) {
  const sonos = hass.states[SONOS];
  const cast = hass.states[CHROMECAST];
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  // Order: whatever started most recently first; with nothing playing, Sonos
  // first (that's where you start music).
  const castFirst =
    !!cast &&
    isCasting(cast) &&
    (!hasMedia(sonos) || Date.parse(cast.last_changed) > Date.parse(sonos!.last_changed));

  const pages = [
    { key: 'sonos', node: <SonosPage hass={hass} /> },
    ...(cast ? [{ key: 'cast', node: <CastPage hass={hass} player={cast} /> }] : []),
  ];
  if (castFirst) pages.reverse();

  // A new order starts at the first page again.
  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    setPage(0);
  }, [castFirst]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="media-card">
      <div className="media-card__pages" ref={scroller} onScroll={onScroll}>
        {pages.map((p) => (
          <div className="media-card__page" key={p.key}>
            {p.node}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        <div className="page-dots" aria-hidden>
          {pages.map((p, i) => (
            <i key={p.key} className={i === page ? 'is-active' : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Sonos page: what's playing on top, stream buttons below. */
function SonosPage({ hass }: Props) {
  const player = hass.states[SONOS];
  const buttons = useMemo(() => streamButtons(STREAM_SCRIPTS, hass.states), [hass.states]);

  const [starting, setStarting] = useState<Starting>(null);
  const [failed, setFailed] = useState(false);
  const timeout = useRef<number | undefined>(undefined);
  const errorTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timeout.current);
      window.clearTimeout(errorTimer.current);
    },
    [],
  );

  // Done as soon as the Sonos plays something new.
  useEffect(() => {
    if (starting && player?.state === 'playing' && mediaKey(player) !== starting.before) {
      window.clearTimeout(timeout.current);
      setStarting(null);
    }
  }, [player, starting]);

  const fail = () => {
    window.clearTimeout(timeout.current);
    setStarting(null);
    setFailed(true);
    window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setFailed(false), ERROR_VISIBLE);
  };

  const startStream = (script: string) => {
    if (starting) return;
    setFailed(false);
    setStarting({ script, before: mediaKey(player) });
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(fail, START_TIMEOUT);
    hass.callService('script', 'turn_on', {}, { entity_id: script }).catch((err) => {
      console.error(err);
      fail();
    });
  };

  return (
    <section className="mini-player" aria-label="Muziek">
      <TopRow hass={hass} player={player} starting={!!starting} failed={failed} />
      {buttons.length > 0 && (
        <div className="mini-player__streams">
          {buttons.map((b, i) => (
            <button
              key={b.script}
              type="button"
              className="stream-pill"
              disabled={!!starting && starting.script !== b.script}
              aria-busy={starting?.script === b.script}
              onClick={() => startStream(b.script)}
            >
              {starting?.script === b.script ? (
                <span className="stream-pill__logo stream-pill__logo--busy" aria-hidden>
                  <span className="spinner" />
                </span>
              ) : (
                <span className="stream-pill__logo" style={{ background: DOTS[i % DOTS.length] }} aria-hidden />
              )}
              <span className="stream-pill__label">{b.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

interface TopRowProps {
  hass: HomeAssistant;
  player?: HassEntity;
  starting: boolean;
  failed: boolean;
}

function TopRow({ hass, player, starting, failed }: TopRowProps) {
  if (starting || failed || !hasMedia(player)) {
    const [title, subtitle] = starting
      ? ['Starten…', 'Even geduld, de stream laadt']
      : failed
        ? ['Dat lukte niet', 'De stream startte niet, probeer opnieuw']
        : ['Muziek op Sonos', 'Kies een stream om te beginnen'];
    return (
      <div className="mini-player__top">
        <span className="mini-player__art mini-player__art--icon" aria-hidden>
          <Icon name="radio" />
        </span>
        <span className="mini-player__text">
          <span className={`mini-player__title${failed ? ' is-error' : ''}`}>{title}</span>
          <span className="mini-player__subtitle">{subtitle}</span>
        </span>
      </div>
    );
  }

  const p = player!;
  const { title, subtitle } = nowPlaying(p);
  const picture = p.attributes.entity_picture ? String(p.attributes.entity_picture) : undefined;
  const src = picture && hass.hassUrl ? hass.hassUrl(picture) : picture;
  const playing = p.state === 'playing';

  return (
    <div className="mini-player__top">
      {src ? (
        <img className="mini-player__art" src={src} alt="" />
      ) : (
        <span className="mini-player__art mini-player__art--icon" aria-hidden>
          <Icon name="music" />
        </span>
      )}
      <span className="mini-player__text">
        <span className="mini-player__title">{title}</span>
        {subtitle && <span className="mini-player__subtitle">{subtitle}</span>}
      </span>
      <button
        type="button"
        className="round-button"
        aria-label={playing ? 'Pauzeren' : 'Afspelen'}
        onClick={() => hass.callService('media_player', 'media_play_pause', {}, { entity_id: p.entity_id })}
      >
        <Icon name={playing ? 'pause' : 'play'} />
      </button>
    </div>
  );
}
