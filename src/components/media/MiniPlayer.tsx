import { useLayoutEffect, useState } from 'react';
import { CHROMECAST } from '../../config/media';
import { usePager } from '../../hooks/usePager';
import type { HomeAssistant } from '../../types/hass';
import { CastPage } from './CastPage';
import { ExpandedPlayer } from './ExpandedPlayer';
import { SonosPage } from './SonosPage';

interface Props {
  hass: HomeAssistant;
}

/**
 * Media card on Thuis (docs/design/media-card): the mini player with one page
 * per device (Chromecast first, then Sonos), swiped horizontally and always
 * snapping to a whole page. Tapping a page's top row opens the expanded player
 * on that device; closing it returns to the mini player on the same page.
 */
export function MiniPlayer({ hass }: Props) {
  const pager = usePager();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  // Back from the expanded player: show the page that was last in view.
  useLayoutEffect(() => {
    if (expanded === null) pager.jumpTo(page);
  }, [expanded, page, pager.jumpTo]);

  if (expanded !== null) {
    const close = () => setExpanded(null);
    return (
      <>
        <div className="media-backdrop" onClick={close} />
        <ExpandedPlayer hass={hass} initialPage={expanded} onPageChange={setPage} onClose={close} />
      </>
    );
  }

  const open = (p: number) => {
    setPage(p);
    setExpanded(p);
  };

  return (
    <div className="media-card">
      <div className="media-card__pages" ref={pager.ref} onScroll={pager.onScroll}>
        <div className="media-card__page">
          <CastPage hass={hass} player={hass.states[CHROMECAST]} onOpen={() => open(0)} />
        </div>
        <div className="media-card__page">
          <SonosPage hass={hass} onOpen={() => open(1)} />
        </div>
      </div>
      <div className="page-dots" aria-hidden>
        <i className={pager.page === 0 ? 'is-active' : undefined} />
        <i className={pager.page === 1 ? 'is-active' : undefined} />
      </div>
    </div>
  );
}
