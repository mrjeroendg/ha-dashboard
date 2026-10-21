import { useEffect, useRef, useState } from 'react';
import { CHROMECAST, SONOS } from '../config/media';
import { hasMedia, isCasting } from '../lib/media';
import type { HomeAssistant } from '../types/hass';
import { CastPage } from './CastPage';
import { SonosPage } from './SonosPage';

interface Props {
  hass: HomeAssistant;
}

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
