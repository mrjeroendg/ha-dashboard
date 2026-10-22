import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { Camera } from '../../config/cameras';
import { usePager } from '../../hooks/usePager';
import type { HomeAssistant } from '../../types/hass';
import { CameraPage } from './CameraPage';

interface Props {
  hass: HomeAssistant;
  cameras: Camera[];
  initialPage: number;
  onClose(): void;
}

/** How far you have to drag the handle down before the sheet closes. */
const CLOSE_DISTANCE = 90;

/**
 * Live sheet (docs/design/cameras): one page per camera, swiped sideways with
 * the same snapping as the media card. Only the camera in view streams. Swipe
 * the handle down or tap the dimmed page to close.
 */
export function CameraSheet({ hass, cameras, initialPage, onClose }: Props) {
  const pager = usePager();
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);

  useLayoutEffect(() => {
    pager.jumpTo(initialPage);
  }, [initialPage, pager.jumpTo]);

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
    <>
      <div className="camera-backdrop" onClick={onClose} />
      <div
        className={`camera-sheet${drag ? ' is-dragging' : ''}`}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        role="dialog"
        aria-label="Camera's"
      >
        <div
          className="camera-sheet__grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="xp__handle" />
          {cameras.length > 1 && (
            <div className="page-dots page-dots--top" aria-hidden>
              {cameras.map((c, i) => (
                <i key={c.entity} className={pager.page === i ? 'is-active' : undefined} />
              ))}
            </div>
          )}
        </div>
        <div className="media-card__pages camera-sheet__pages" ref={pager.ref} onScroll={pager.onScroll}>
          {cameras.map((camera, i) => (
            <div key={camera.entity} className="media-card__page camera-sheet__page">
              <CameraPage hass={hass} camera={camera} live={pager.page === i} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
