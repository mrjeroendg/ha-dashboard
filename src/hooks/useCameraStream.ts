import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useRef, useState } from 'react';
import { canPlayHls, hlsUrl, mjpegUrl, platformName } from '../lib/cameras';
import { connectWebRtc, type WebRtcRoute } from '../lib/webrtc';
import type { HomeAssistant } from '../types/hass';

export type StreamPhase = 'webrtc' | 'hls' | 'mjpeg' | 'still';

export type StreamMedia =
  | { kind: 'webrtc'; stream: MediaStream }
  | { kind: 'hls'; url: string }
  | { kind: 'mjpeg'; url: string };

export interface StreamState {
  status: 'idle' | 'trying' | 'playing' | 'still';
  phase: StreamPhase;
  /** WebRTC only: which try this is (1, 2, …). */
  attempt: number;
  /** When the current phase started, and how long it gets before giving up (for the countdown bar). */
  phaseStart: number;
  timeout: number;
  media?: StreamMedia;
  route?: WebRtcRoute;
  /** Time from opening to the first frame. */
  connectMs?: number;
}

/** How long each phase gets before switching to the next one. HLS starts slower: HA first builds the stream. */
const TIMEOUT: Record<StreamPhase, number> = { webrtc: 8000, hls: 15000, mjpeg: 8000, still: 0 };

const IDLE: StreamState = { status: 'idle', phase: 'still', attempt: 0, phaseStart: 0, timeout: 0 };

/**
 * Live video for one camera (docs/design/cameras, "Stream status"): tries
 * WebRTC first (like HA's own player), then HLS where the browser plays it
 * itself (iOS, Safari), then MJPEG, and ends on the still image. Exposes the
 * active phase, so the sheet can show what it's trying.
 */
export function useCameraStream(hass: HomeAssistant, entity: HassEntity, live: boolean) {
  const [state, setState] = useState<StreamState>(IDLE);
  const hassRef = useRef(hass);
  const entityRef = useRef(entity);
  hassRef.current = hass;
  entityRef.current = entity;
  const waiter = useRef<{ resolve(): void; reject(err: Error): void } | undefined>(undefined);
  const id = entity.entity_id;

  useEffect(() => {
    if (!live) {
      setState(IDLE);
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    const opened = Date.now();

    /** Wait for the media element to report its first frame, at most `ms`. */
    const firstFrame = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('Te traag')), ms);
        const done = (fn: () => void) => () => {
          window.clearTimeout(timer);
          fn();
        };
        waiter.current = { resolve: done(resolve), reject: (err) => done(() => reject(err))() };
        signal.addEventListener('abort', done(() => reject(new Error('Afgebroken'))));
      });

    const startPhase = (phase: StreamPhase, attempt = 1, phaseStart = Date.now()) =>
      setState({ status: 'trying', phase, attempt, phaseStart, timeout: TIMEOUT[phase] });

    const playing = (route?: WebRtcRoute) =>
      setState((s) => ({ ...s, status: 'playing', route, connectMs: Date.now() - opened }));

    const tryWebRtc = async () => {
      const phaseStart = Date.now();
      const deadline = phaseStart + TIMEOUT.webrtc;
      for (let attempt = 1; Date.now() < deadline - 500; attempt++) {
        startPhase('webrtc', attempt, phaseStart);
        const attemptController = new AbortController();
        const stop = () => attemptController.abort();
        signal.addEventListener('abort', stop);
        const timer = window.setTimeout(stop, deadline - Date.now());
        try {
          const connection = await connectWebRtc(hassRef.current, id, attemptController.signal);
          setState((s) => ({ ...s, media: { kind: 'webrtc', stream: connection.stream } }));
          await firstFrame(Math.max(deadline - Date.now(), 1000));
          window.clearTimeout(timer);
          playing(await connection.route());
          return true;
        } catch {
          window.clearTimeout(timer);
          stop();
          if (signal.aborted) return false;
          await new Promise((r) => window.setTimeout(r, 300));
        }
      }
      return false;
    };

    const tryMedia = async (phase: 'hls' | 'mjpeg', url: () => Promise<string | undefined>) => {
      startPhase(phase);
      try {
        const src = await url();
        if (!src) return false;
        setState((s) => ({ ...s, media: phase === 'hls' ? { kind: 'hls', url: src } : { kind: 'mjpeg', url: src } }));
        await firstFrame(TIMEOUT[phase]);
        playing();
        return true;
      } catch {
        return false;
      }
    };

    const run = async () => {
      const capabilities = await hassRef.current
        .callWS<{ frontend_stream_types: string[] }>({ type: 'camera/capabilities', entity_id: id })
        .then((c) => c.frontend_stream_types)
        .catch(() => [] as string[]);
      if (signal.aborted) return;

      const webRtc = capabilities.includes('web_rtc') && !!hassRef.current.connection && 'RTCPeerConnection' in window;
      const hls = capabilities.includes('hls') && canPlayHls();

      if (webRtc && (await tryWebRtc())) return;
      if (signal.aborted) return;
      if (hls && (await tryMedia('hls', () => hlsUrl(hassRef.current, id)))) return;
      if (signal.aborted) return;
      if (await tryMedia('mjpeg', async () => mjpegUrl(hassRef.current, entityRef.current))) return;
      if (signal.aborted) return;
      setState({ ...IDLE, status: 'still', phase: 'still' });
    };

    run();
    return () => controller.abort();
  }, [id, live]);

  return {
    state,
    platform: platformName(),
    onFirstFrame: () => waiter.current?.resolve(),
    onMediaError: () => waiter.current?.reject(new Error('Mediafout')),
  };
}
