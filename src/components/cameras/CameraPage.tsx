import { useState } from 'react';
import type { Camera } from '../../config/cameras';
import { useCameraStream, type StreamSource } from '../../hooks/useCameraStream';
import { stillImageUrl } from '../../lib/cameras';
import type { HomeAssistant } from '../../types/hass';
import { LiveImage } from './LiveImage';

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
  const isStill = stream.currentStep?.kind === 'still';

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
      <p className={`stream-status${stream.isPlaying ? ' is-playing' : ''}${isStill ? ' is-still' : ''}`}>
        {stream.isPlaying || isStill ? <span className="stream-status__dot" aria-hidden /> : <span className="spinner" aria-hidden />}
        {streamStatusText(stream.isPlaying, isStill, stream.source)}
      </p>
      <h2 className="camera-page__name">{camera.name}</h2>
    </div>
  );
}

const STREAM_NAMES = { webrtc: 'WebRTC', hls: 'HLS', mjpeg: 'MJPEG' };

/** "Verbinden…" until there's a picture, then what plays: "WebRTC · relay", "HLS" or "MJPEG". */
function streamStatusText(isPlaying: boolean, isStill: boolean, source: StreamSource | undefined): string {
  if (isStill) return 'Stilstaand beeld';
  if (!isPlaying || !source) return 'Verbinden…';

  const streamName = STREAM_NAMES[source.kind];
  const webRtcRoute = source.kind === 'webrtc' ? source.route : undefined;

  return webRtcRoute ? `${streamName} · ${webRtcRoute}` : streamName;
}
