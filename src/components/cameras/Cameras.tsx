import { useEffect, useState } from 'react';
import type { Camera } from '../../config/cameras';
import { camerasIn, clock, stillUrl } from '../../lib/cameras';
import { haptic } from '../../lib/haptic';
import type { HomeAssistant } from '../../types/hass';
import { CameraSheet } from './CameraSheet';

interface Props {
  hass: HomeAssistant;
}

/** How often the tiles fetch a new still image. */
const REFRESH_MS = 10_000;

/**
 * "Camera's" on Thuis (docs/design/cameras): the first camera as one large
 * 16:9 tile, the others as 4:3 tiles two by two. Fixed order, still images
 * refreshed every 10 s. Tapping a tile opens the live sheet on that camera.
 */
export function Cameras({ hass }: Props) {
  const cameras = camerasIn(hass.states);
  const [open, setOpen] = useState<number | null>(null);
  const [stamp, setStamp] = useState(() => Date.now());

  useEffect(() => {
    // Stop refreshing behind the live sheet: only the visible camera streams.
    if (open !== null) return;
    const id = window.setInterval(() => setStamp(Date.now()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [open]);

  if (cameras.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">Camera's</h2>
      <div className="camera-grid">
        {cameras.map((camera, i) => (
          <CameraTile
            key={camera.entity}
            camera={camera}
            hass={hass}
            stamp={stamp}
            large={i === 0}
            onOpen={() => {
              haptic('light');
              setOpen(i);
            }}
          />
        ))}
      </div>
      {open !== null && (
        <CameraSheet hass={hass} cameras={cameras} initialPage={open} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}

interface TileProps {
  camera: Camera;
  hass: HomeAssistant;
  stamp: number;
  large: boolean;
  onOpen(): void;
}

function CameraTile({ camera, hass, stamp, large, onOpen }: TileProps) {
  const src = stillUrl(hass, hass.states[camera.entity], stamp);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  return (
    <button type="button" className={`camera-tile${large ? ' camera-tile--large' : ''}`} onClick={onOpen}>
      {src && <img className="camera-tile__image" src={src} alt="" onLoad={() => setLoadedAt(new Date())} />}
      {loadedAt && <span className="camera-time">{clock(loadedAt)}</span>}
      <span className="camera-tile__name">{camera.name}</span>
    </button>
  );
}
