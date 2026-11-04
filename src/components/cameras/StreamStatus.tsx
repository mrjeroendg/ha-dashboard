import type { StreamSource, useCameraStream } from '../../hooks/useCameraStream';

interface Props {
  stream: ReturnType<typeof useCameraStream>;
  /** Extra class for its place, e.g. in a room's camera row. */
  className?: string;
}

/**
 * One line with what the stream is doing (docs/design/cameras): a spinner with
 * "Verbinden…", then a green dot with what plays ("WebRTC · relay", "HLS",
 * "MJPEG"), or a grey dot with "Stilstaand beeld". Shared by the live sheet
 * and a room's camera row.
 */
export function StreamStatus({ stream, className }: Props) {
  const isStill = stream.currentStep?.kind === 'still';
  const isShowingPicture = stream.isPlaying || isStill;

  return (
    <p className={`stream-status${stream.isPlaying ? ' is-playing' : ''}${isStill ? ' is-still' : ''}${className ? ` ${className}` : ''}`}>
      {isShowingPicture ? <span className="stream-status__dot" aria-hidden /> : <span className="spinner" aria-hidden />}
      {streamStatusText(stream.isPlaying, isStill, stream.source)}
    </p>
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
