import { useEffect, useRef } from 'react';
import type { StreamSource } from '../../hooks/useCameraStream';

interface Props {
  stillImageUrl?: string;
  /** The current step's source; nothing while it connects, or on the still image. */
  source?: StreamSource;
  onPlaying(): void;
  onError(): void;
}

/** The live image: the stream's source over the still image, so you never see a black frame. */
export function LiveImage({ stillImageUrl, source, onPlaying, onError }: Props) {
  return (
    <>
      {stillImageUrl && <img className="camera-live__media" src={stillImageUrl} alt="" />}
      {source?.kind === 'webrtc' && <WebRtcVideo videoStream={source.videoStream} onPlaying={onPlaying} onError={onError} />}
      {source?.kind === 'hls' && (
        <video key={source.url} className="camera-live__media" src={source.url} autoPlay muted playsInline controls onPlaying={onPlaying} onError={onError} />
      )}
      {source?.kind === 'mjpeg' && <MjpegImage key={source.url} url={source.url} onPlaying={onPlaying} onError={onError} />}
    </>
  );
}

interface WebRtcVideoProps {
  videoStream: MediaStream;
  onPlaying(): void;
  onError(): void;
}

/** WebRTC's video has no address: it's handed to the `<video>` itself. Muted, so iOS plays it on its own. */
function WebRtcVideo({ videoStream, onPlaying, onError }: WebRtcVideoProps) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video.current) video.current.srcObject = videoStream;
  }, [videoStream]);

  return <video ref={video} className="camera-live__media" autoPlay muted playsInline controls onPlaying={onPlaying} onError={onError} />;
}

interface MjpegImageProps {
  url: string;
  onPlaying(): void;
  onError(): void;
}

/** How often to check whether the MJPEG stream has shown its first frame. */
const FIRST_FRAME_CHECK_MS = 200;

/**
 * MJPEG is an `<img>` that keeps loading, so its `load` event doesn't always
 * come. It plays once the image has a size: its first frame has arrived.
 */
function MjpegImage({ url, onPlaying, onError }: MjpegImageProps) {
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const firstFrameCheck = window.setInterval(() => {
      const hasFirstFrame = (image.current?.naturalWidth ?? 0) > 0;
      if (!hasFirstFrame) return;

      window.clearInterval(firstFrameCheck);
      onPlaying();
    }, FIRST_FRAME_CHECK_MS);

    return () => window.clearInterval(firstFrameCheck);
    // Once per stream; onPlaying is a new function on every render, but does the same.
  }, [url]);

  return <img ref={image} className="camera-live__media" src={url} alt="" onError={onError} />;
}
