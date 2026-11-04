import { useState } from 'react';
import type { Camera } from '../../config/cameras';
import { useCameraStream } from '../../hooks/useCameraStream';
import { stillImageUrl } from '../../lib/cameras';
import type { HomeAssistant } from '../../types/hass';
import { LiveImage } from './LiveImage';
import { StreamStatus } from './StreamStatus';

interface Props {
  hass: HomeAssistant;
  camera: Camera;
  /** The page in view streams live; the others show their still image. */
  isInView: boolean;
}

/** One camera in the live sheet: the live image, one status line, and the name. */
export function CameraPage({ hass, camera, isInView }: Props) {
  const cameraEntity = hass.states[camera.entity];
  // The still image of when the sheet opened, under the stream.
  const [openedAt] = useState(() => Date.now());
  const stream = useCameraStream(hass, cameraEntity, isInView);

  return (
    <div className="camera-page">
      <div className="camera-live">
        <LiveImage
          stillImageUrl={stillImageUrl(hass, cameraEntity, openedAt)}
          source={stream.source}
          onPlaying={stream.onPlaying}
          onError={stream.onError}
        />
      </div>
      <StreamStatus stream={stream} />
      <h2 className="camera-page__name">{camera.name}</h2>
    </div>
  );
}
