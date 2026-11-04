import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useState, type CSSProperties } from 'react';
import type { Entity } from '../../config/entities';
import { useCameraStream } from '../../hooks/useCameraStream';
import { useStillImageRefresh } from '../../hooks/useStillImageRefresh';
import { stillImageUrl } from '../../lib/cameras';
import { haptic } from '../../lib/haptic';
import { formatTime } from '../../lib/moment';
import type { HomeAssistant } from '../../types/hass';
import { Icon, type IconName } from '../Icon';
import { CameraSheet } from './CameraSheet';
import { LiveImage } from './LiveImage';
import { StreamStatus } from './StreamStatus';

interface Props {
  hass: HomeAssistant;
  cameraEntity: HassEntity;
  name: string;
  icon: IconName;
}

/**
 * A camera in a room (docs/design/room-camera, option B with S1): the icon,
 * the name and when the still image was fetched, with the still image (16:9)
 * under it, refreshed every 10 s like the tiles on Thuis. "Stream" plays it
 * live right there, with the live sheet's own stream and status line, so the
 * room's other controls stay at hand; "Stop" ends it, and so do leaving the
 * room and putting the app away. A tap on the picture opens the live sheet,
 * with only this camera.
 */
export function CameraRow({ hass, cameraEntity, name, icon }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isStreamingHere, setIsStreamingHere] = useState(false);
  const refreshStamp = useStillImageRefresh(isSheetOpen || isStreamingHere);
  const stream = useCameraStream(hass, cameraEntity, isStreamingHere);
  const imageUrl = stillImageUrl(hass, cameraEntity, refreshStamp);
  // The entity comes from the room's config, so it's an `Entity`.
  const cameraOnItsOwn = [{ entity: cameraEntity.entity_id as Entity, name }];

  // In the background the stream would keep using data for nothing.
  useEffect(() => {
    if (!isStreamingHere) return;

    const stopWhenHidden = () => {
      if (document.visibilityState === 'hidden') setIsStreamingHere(false);
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => document.removeEventListener('visibilitychange', stopWhenHidden);
  }, [isStreamingHere]);

  const toggleStreamingHere = () => {
    haptic('light');
    setIsStreamingHere(!isStreamingHere);
  };
  // One stream at a time: the sheet takes over.
  const openSheet = () => {
    haptic('light');
    setIsStreamingHere(false);
    setIsSheetOpen(true);
  };

  return (
    <div className="row-item">
      <div className="row camera-row">
        <span className="icon-tile">
          <Icon name={icon} />
        </span>
        <span className="card-text">
          <span className="row__name">{name}</span>
          {isStreamingHere ? (
            <StreamStatus stream={stream} className="camera-row__status" />
          ) : (
            <span className="card-detail">Bijgewerkt {formatTime(new Date(refreshStamp))}</span>
          )}
        </span>
        <button
          type="button"
          className="pill-button"
          style={isStreamingHere ? ({ '--pill-color': 'var(--text)' } as CSSProperties) : undefined}
          onClick={toggleStreamingHere}
        >
          {isStreamingHere ? 'Stop' : 'Stream'}
        </button>
        {/* Not a <button>: while it streams, the video's own controls are inside. */}
        <div className="camera-row__image" role="button" tabIndex={0} aria-label={`${name} groot bekijken`} onClick={openSheet}>
          {isStreamingHere ? (
            <LiveImage stillImageUrl={imageUrl} source={stream.source} onPlaying={stream.onPlaying} onError={stream.onError} />
          ) : (
            imageUrl && <img className="camera-tile__image" src={imageUrl} alt="" />
          )}
        </div>
      </div>
      {isSheetOpen && <CameraSheet hass={hass} cameras={cameraOnItsOwn} openedCameraNumber={0} onClose={() => setIsSheetOpen(false)} />}
    </div>
  );
}
