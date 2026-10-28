import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useRef, useState } from 'react';
import type { StreamMedia } from '../../hooks/useCameraStream';
import { stillUrl } from '../../lib/cameras';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
  entity: HassEntity;
  media?: StreamMedia;
  onFirstFrame(): void;
  onMediaError(): void;
}

/** The live image: the stream the hook found, with the still image behind it until the first frame. */
export function LiveImage({ hass, entity, media, onFirstFrame, onMediaError }: Props) {
  const [stamp] = useState(() => Date.now());
  const still = stillUrl(hass, entity, stamp);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video.current && media?.kind === 'webrtc') video.current.srcObject = media.stream;
  }, [media]);

  return (
    <>
      {still && <img className="camera-live__media" src={still} alt="" />}
      {(media?.kind === 'webrtc' || media?.kind === 'hls') && (
        <video
          key={media.kind === 'hls' ? media.url : 'webrtc'}
          ref={video}
          className="camera-live__media"
          src={media.kind === 'hls' ? media.url : undefined}
          autoPlay
          muted
          playsInline
          onPlaying={onFirstFrame}
          onError={onMediaError}
        />
      )}
      {media?.kind === 'mjpeg' && (
        <img className="camera-live__media" src={media.url} alt="" onLoad={onFirstFrame} onError={onMediaError} />
      )}
    </>
  );
}
