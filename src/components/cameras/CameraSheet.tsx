import { useLayoutEffect } from 'react';
import type { Camera } from '../../config/cameras';
import { usePager } from '../../hooks/usePager';
import type { HomeAssistant } from '../../types/hass';
import { BottomSheet } from '../BottomSheet';
import { CameraPage } from './CameraPage';

interface Props {
  hass: HomeAssistant;
  cameras: Camera[];
  /** The camera that was tapped: the sheet opens on its page. */
  openedCameraNumber: number;
  onClose(): void;
}

/**
 * The live sheet (docs/design/cameras): one page per camera, swiped sideways
 * with the same snapping as the media card. Only the camera in view streams.
 */
export function CameraSheet({ hass, cameras, openedCameraNumber, onClose }: Props) {
  const pager = usePager();

  useLayoutEffect(() => {
    pager.jumpTo(openedCameraNumber);
  }, [openedCameraNumber, pager.jumpTo]);

  const hasMoreThanOneCamera = cameras.length > 1;
  const pageDots = hasMoreThanOneCamera && (
    <div className="page-dots page-dots--top" aria-hidden>
      {cameras.map((camera, cameraNumber) => (
        <i key={camera.entity} className={pager.page === cameraNumber ? 'is-active' : undefined} />
      ))}
    </div>
  );

  return (
    <BottomSheet label="Camera's" besideHandle={pageDots} onClose={onClose}>
      <div className="media-card__pages" ref={pager.ref} onScroll={pager.onScroll}>
        {cameras.map((camera, cameraNumber) => (
          <div key={camera.entity} className="media-card__page">
            <CameraPage hass={hass} camera={camera} isInView={pager.page === cameraNumber} />
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
