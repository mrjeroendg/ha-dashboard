import { useRef, useState } from 'react';
import { CHROMECAST } from '../config/media';
import type { HomeAssistant } from '../types/hass';
import { CastPage } from './CastPage';
import { SonosPage } from './SonosPage';

interface Props {
  hass: HomeAssistant;
}

/**
 * Mini media player on Thuis (docs/design/media-card): one page per device,
 * Chromecast first, then Sonos, swiped horizontally and always snapping to a
 * whole page.
 */
export function MiniPlayer({ hass }: Props) {
  const cast = hass.states[CHROMECAST];
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  // Fixed order: Chromecast first, then Sonos.
  const pages = [
    ...(cast ? [{ key: 'cast', node: <CastPage hass={hass} player={cast} /> }] : []),
    { key: 'sonos', node: <SonosPage hass={hass} /> },
  ];

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
