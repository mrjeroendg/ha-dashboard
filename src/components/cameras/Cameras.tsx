import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useState } from 'react';
import { configuredCameras, stillImageUrl } from '../../lib/cameras';
import { haptic } from '../../lib/haptic';
import type { HomeAssistant } from '../../types/hass';
import { CameraSheet } from './CameraSheet';

interface Props {
  hass: HomeAssistant;
}

/** How often the tiles fetch a new still image. */
const TILE_REFRESH_MS = 10_000;

/**
 * "Camera's" on Thuis (docs/design/cameras): the first camera as one large
 * 16:9 tile, the others as 4:3 tiles two by two. Fixed order, still images
 * refreshed every 10 s. Tapping a tile opens the live sheet on that camera.
 */
export function Cameras({ hass }: Props) {
  const cameras = configuredCameras(hass.states);
  const [openedCameraNumber, setOpenedCameraNumber] = useState<number | null>(null);
  const [refreshStamp, setRefreshStamp] = useState(() => Date.now());
  const isSheetOpen = openedCameraNumber !== null;

  useEffect(() => {
    // Not behind the live sheet: there, only the camera in view streams.
    if (isSheetOpen) return;

    const refreshTimer = window.setInterval(() => setRefreshStamp(Date.now()), TILE_REFRESH_MS);
    return () => window.clearInterval(refreshTimer);
  }, [isSheetOpen]);

  if (cameras.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">Camera's</h2>
      <div className="camera-grid">
        {cameras.map((camera, cameraNumber) => (
          <CameraTile
            key={camera.entity}
            cameraEntity={hass.states[camera.entity]}
            hass={hass}
            refreshStamp={refreshStamp}
            isLarge={cameraNumber === 0}
            onOpen={() => {
              haptic('light');
              setOpenedCameraNumber(cameraNumber);
            }}
          />
        ))}
      </div>
      {isSheetOpen && (
        <CameraSheet hass={hass} cameras={cameras} openedCameraNumber={openedCameraNumber} onClose={() => setOpenedCameraNumber(null)} />
      )}
    </section>
  );
}

interface CameraTileProps {
  cameraEntity: HassEntity;
  hass: HomeAssistant;
  refreshStamp: number;
  isLarge: boolean;
  onOpen(): void;
}

function CameraTile({ cameraEntity, hass, refreshStamp, isLarge, onOpen }: CameraTileProps) {
  const imageUrl = stillImageUrl(hass, cameraEntity, refreshStamp);

  return (
    <button type="button" className={`camera-tile${isLarge ? ' camera-tile--large' : ''}`} onClick={onOpen}>
      {imageUrl && <img className="camera-tile__image" src={imageUrl} alt="" />}
    </button>
  );
}
