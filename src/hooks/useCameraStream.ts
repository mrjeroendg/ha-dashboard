import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useState } from 'react';
import { canPlayHls, hlsUrl, mjpegUrl, streamTypes } from '../lib/cameras';
import { connectWebRtc, type WebRtcConnection, type WebRtcRoute } from '../lib/webrtc';
import type { HomeAssistant } from '../types/hass';

/** One step in getting live video, tried in order until one shows a picture (docs/design/cameras). */
export type StreamStep = { kind: 'webrtc'; attempt: number } | { kind: 'hls' } | { kind: 'mjpeg' } | { kind: 'still' };

/** What `LiveImage` shows for a step: WebRTC's video, or the address of the HLS or MJPEG stream. */
export type StreamSource =
  | { kind: 'webrtc'; videoStream: MediaStream; route?: WebRtcRoute }
  | { kind: 'hls'; url: string }
  | { kind: 'mjpeg'; url: string };

const WEBRTC_ATTEMPTS = [1, 2, 3];
const PAUSE_BEFORE_WEBRTC_RETRY_MS = 1000;
/** How long a step gets to show a picture. HLS gets longer: HA first has to build the stream. */
const TIME_LIMIT_MS = { webrtc: 5000, hls: 15000, mjpeg: 8000 };

/** All the steps this camera and browser can do, in order, ending on the still image. */
function possibleSteps(hass: HomeAssistant, haStreamTypes: string[]): StreamStep[] {
  const canUseWebRtc = haStreamTypes.includes('web_rtc') && hass.connection !== undefined && 'RTCPeerConnection' in window;
  const canUseHls = haStreamTypes.includes('hls') && canPlayHls();

  const webRtcSteps: StreamStep[] = canUseWebRtc ? WEBRTC_ATTEMPTS.map((attempt) => ({ kind: 'webrtc', attempt })) : [];
  const hlsSteps: StreamStep[] = canUseHls ? [{ kind: 'hls' }] : [];

  return [...webRtcSteps, ...hlsSteps, { kind: 'mjpeg' }, { kind: 'still' }];
}

/** A WebRTC retry first waits a second, so its time limit is a second longer. */
function timeLimitMs(step: Exclude<StreamStep, { kind: 'still' }>): number {
  const isWebRtcRetry = step.kind === 'webrtc' && step.attempt > 1;
  return TIME_LIMIT_MS[step.kind] + (isWebRtcRetry ? PAUSE_BEFORE_WEBRTC_RETRY_MS : 0);
}

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

/**
 * Live video for one camera: remembers which step it's on, and moves to the
 * next one when a step fails or runs out of time. `LiveImage` shows the
 * step's source and reports back with `onPlaying` and `onError`. Only while
 * `isInView`; leaving view stops it.
 */
export function useCameraStream(hass: HomeAssistant, cameraEntity: HassEntity, isInView: boolean) {
  const entityId = cameraEntity.entity_id;
  const [steps, setSteps] = useState<StreamStep[] | undefined>(undefined);
  const [stepNumber, setStepNumber] = useState(0);
  // Counts the restarts after a drop: going back to step 0 must restart it, also when it's already on step 0.
  const [restartCount, setRestartCount] = useState(0);
  const [source, setSource] = useState<StreamSource | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentStep = steps?.[stepNumber];
  const goToNextStep = () => setStepNumber((previousStepNumber) => previousStepNumber + 1);
  const startAgainFromTheTop = () => {
    setStepNumber(0);
    setRestartCount((previousRestartCount) => previousRestartCount + 1);
  };

  // 1. Coming into view: which steps are possible. Leaving view: forget them, which stops the stream.
  useEffect(() => {
    if (!isInView) {
      setSteps(undefined);
      setStepNumber(0);
      return;
    }

    let hasLeftView = false;
    streamTypes(hass, entityId).then((haStreamTypes) => {
      if (!hasLeftView) setSteps(possibleSteps(hass, haStreamTypes));
    });
    return () => {
      hasLeftView = true;
    };
    // Once per time it comes into view; hass changes on every state update.
  }, [entityId, isInView]);

  // 2. Start the current step: get its source and hand it to LiveImage. A failure goes to the next step.
  useEffect(() => {
    setSource(undefined);
    setIsPlaying(false);
    if (!currentStep || currentStep.kind === 'still') return;

    const stepController = new AbortController();
    let webRtcConnection: WebRtcConnection | undefined;

    const sourceOfStep = async (): Promise<StreamSource> => {
      if (currentStep.kind === 'webrtc') {
        const isRetry = currentStep.attempt > 1;
        if (isRetry) await wait(PAUSE_BEFORE_WEBRTC_RETRY_MS);

        const connection = await connectWebRtc(hass, entityId, stepController.signal, startAgainFromTheTop);
        // Stopped while it was connecting: close it, nobody will show it.
        if (stepController.signal.aborted) {
          connection.close();
          throw new Error('Afgebroken');
        }
        webRtcConnection = connection;

        return { kind: 'webrtc', videoStream: connection.videoStream, route: await connection.route() };
      }
      if (currentStep.kind === 'hls') return { kind: 'hls', url: await hlsUrl(hass, entityId) };

      const url = mjpegUrl(hass, cameraEntity);
      if (!url) throw new Error('Geen toegangstoken');
      return { kind: 'mjpeg', url };
    };

    sourceOfStep()
      .then((stepSource) => {
        if (!stepController.signal.aborted) setSource(stepSource);
      })
      .catch(() => {
        if (!stepController.signal.aborted) goToNextStep();
      });

    return () => {
      stepController.abort();
      webRtcConnection?.close();
    };
    // Once per step; it reads hass and the entity when it starts. hass changes on every state update.
  }, [currentStep, restartCount]);

  // 3. The time limit: no picture in time means the next step. A picture stops the clock.
  useEffect(() => {
    if (!currentStep || currentStep.kind === 'still' || isPlaying) return;

    const giveUpTimer = window.setTimeout(goToNextStep, timeLimitMs(currentStep));
    return () => window.clearTimeout(giveUpTimer);
  }, [currentStep, restartCount, isPlaying]);

  /** From LiveImage: there's a picture. */
  const onPlaying = () => setIsPlaying(true);

  /** From LiveImage: the video or image failed. Before it played, the next step; after, start again. */
  const onError = () => {
    if (isPlaying) startAgainFromTheTop();
    else goToNextStep();
  };

  return { currentStep, source, isPlaying, onPlaying, onError };
}
