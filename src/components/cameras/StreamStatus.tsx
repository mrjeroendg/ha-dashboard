import { useTicker } from '../../hooks/useTicker';
import type { StreamPhase, StreamState } from '../../hooks/useCameraStream';

const NAMES: Record<StreamPhase, string> = { webrtc: 'WebRTC', hls: 'HLS', mjpeg: 'MJPEG', still: 'Stilstaand beeld' };

const seconds = (ms: number) => (ms / 1000).toLocaleString('nl-BE', { maximumFractionDigits: 1 });

/**
 * Stream status under the live image (docs/design/cameras, option C3): only
 * the active phase, with a bar that fills up until this phase gives up.
 * Connected: a green dot, the route and the time to the first frame.
 */
export function StreamStatus({ state, platform }: { state: StreamState; platform: string }) {
  const now = useTicker(state.status === 'trying');
  const elapsed = Math.max(0, Math.floor((now - state.phaseStart) / 1000));

  if (state.status === 'idle') return <div className="stream-status" aria-hidden />;

  if (state.status === 'still') {
    return (
      <div className="stream-status is-still">
        <div className="stream-status__line">
          <span className="stream-status__dot" />
          Stilstaand beeld
          <em>geen stream</em>
        </div>
        <div className="stream-status__bar" />
      </div>
    );
  }

  if (state.status === 'playing') {
    const label = state.route ? `${NAMES[state.phase]} · ${state.route}` : NAMES[state.phase];
    return (
      <div className="stream-status is-playing">
        <div className="stream-status__line">
          <span className="stream-status__dot" />
          {label}
          {state.connectMs !== undefined && <em>{seconds(state.connectMs)} s</em>}
        </div>
        <div className="stream-status__bar">
          <i />
        </div>
      </div>
    );
  }

  const text = state.phase === 'webrtc' ? 'WebRTC proberen…' : `Overschakelen naar ${NAMES[state.phase]}…`;
  const detail = state.phase === 'webrtc' ? `poging ${state.attempt} · ${elapsed} s` : `${platform} · ${elapsed} s`;
  return (
    <div className="stream-status" role="status">
      <div className="stream-status__line">
        <span className="spinner" aria-hidden />
        {text}
        <em>{detail}</em>
      </div>
      <div className="stream-status__bar">
        {/* A new key per phase restarts the fill; it runs for the phase's whole timeout. */}
        <i key={`${state.phase}-${state.phaseStart}`} style={{ animationDuration: `${state.timeout}ms` }} />
      </div>
    </div>
  );
}
