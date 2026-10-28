import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { MEDIA } from '../../config/media';
import { usePager } from '../../hooks/usePager';
import type { HomeAssistant } from '../../types/hass';
import { CastExpanded } from './CastExpanded';
import { SonosExpanded } from './SonosExpanded';

interface Props {
  hass: HomeAssistant;
  /** Page to open on: 0 = Sonos, 1 = Chromecast (MEDIA_DEVICES). */
  initialPage: number;
  /** Reports the page in view, so the mini player can return to it. */
  onPageChange(page: number): void;
  onClose(): void;
}

/** How far you have to drag the handle down before the card closes. */
const CLOSE_DISTANCE = 90;

/**
 * Expanded player (docs/design/media-card): opens in place above the bottom
 * navigation. Swipe sideways between Sonos and Chromecast; swipe the handle
 * down (or tap the dimmed page) to close.
 */
export function ExpandedPlayer({ hass, initialPage, onPageChange, onClose }: Props) {
  const pager = usePager();
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);

  useLayoutEffect(() => {
    pager.jumpTo(initialPage);
  }, [initialPage, pager.jumpTo]);

  useEffect(() => {
    onPageChange(pager.page);
  }, [pager.page, onPageChange]);

  // Swipe down on the handle area to close.
  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragStart.current !== null) setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    const distance = drag;
    dragStart.current = null;
    setDrag(0);
    if (distance > CLOSE_DISTANCE) onClose();
  };

  return (
    <div
      className={`xp${drag ? ' is-dragging' : ''}`}
      style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      role="dialog"
      aria-label="Speler"
    >
      <div
        className="xp__grab"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="xp__handle" />
        <div className="page-dots page-dots--top" aria-hidden>
          <i className={pager.page === 0 ? 'is-active' : undefined} />
          <i className={pager.page === 1 ? 'is-active' : undefined} />
        </div>
      </div>

      <div className="media-card__pages" ref={pager.ref} onScroll={pager.onScroll}>
        <div className="media-card__page">
          <SonosExpanded hass={hass} player={hass.states[MEDIA.sonos.entity]} />
        </div>
        <div className="media-card__page">
          <CastExpanded hass={hass} player={hass.states[MEDIA.chromecast.entity]} />
        </div>
      </div>
    </div>
  );
}
