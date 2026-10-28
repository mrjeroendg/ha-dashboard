import type { Connection } from 'home-assistant-js-websocket';
import type { HomeAssistant } from '../types/hass';

/** How the video reaches the phone: on the same network, through the router, or via a relay (Nabu Casa). */
export type WebRtcRoute = 'lokaal' | 'direct' | 'relay';

export interface WebRtcConnection {
  videoStream: MediaStream;
  /** Which route the connection ended up on; undefined when the browser doesn't say. */
  route(): Promise<WebRtcRoute | undefined>;
  close(): void;
}

/** What HA sends back after the offer (`camera/webrtc/offer`). */
type OfferMessage =
  | { type: 'session'; session_id: string }
  | { type: 'answer'; answer: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit }
  | { type: 'error'; code: string; message: string };

/**
 * One WebRTC attempt through Home Assistant, the way HA's own player does it:
 * the offer and the network candidates go over HA's websocket, the video comes
 * straight from go2rtc, or via the relay HA hands out (Nabu Casa).
 *
 * Resolves once there's video and the connection is connected; rejects on an
 * error, when the connection fails, or when `signal` aborts. A connection that
 * drops later calls `onDropped`.
 */
export async function connectWebRtc(
  hass: HomeAssistant,
  entityId: string,
  signal: AbortSignal,
  onDropped: () => void,
): Promise<WebRtcConnection> {
  const websocket = hass.connection;
  if (!websocket) throw new Error('Geen websocket');

  const clientConfig = await getClientConfig(hass, entityId);
  signal.throwIfAborted();

  const peerConnection = createReceivingConnection(clientConfig);
  const videoStream = new MediaStream();
  let isClosed = false;
  let stopListeningToHa: (() => Promise<void>) | undefined;

  const close = () => {
    isClosed = true;
    peerConnection.close();
    stopListeningToHa?.().catch(() => undefined);
  };

  try {
    await new Promise<void>((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Afgebroken')));

      const candidateSender = createCandidateSender(hass, entityId);
      peerConnection.onicecandidate = (iceEvent) => {
        if (iceEvent.candidate?.candidate) candidateSender.send(iceEvent.candidate.toJSON());
      };

      // Ready once there's video and the connection is connected, in either order.
      let hasVideo = false;
      let isConnected = false;
      const resolveWhenReady = () => {
        if (hasVideo && isConnected) resolve();
      };
      peerConnection.ontrack = (trackEvent) => {
        videoStream.addTrack(trackEvent.track);
        if (trackEvent.track.kind === 'video') hasVideo = true;
        resolveWhenReady();
      };
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') isConnected = true;
        if (peerConnection.connectionState === 'failed') reject(new Error('Geen verbinding'));
        resolveWhenReady();
      };

      const handleOfferMessage = (offerMessage: OfferMessage) => {
        if (offerMessage.type === 'session') candidateSender.startSending(offerMessage.session_id);
        if (offerMessage.type === 'answer') {
          peerConnection.setRemoteDescription({ type: 'answer', sdp: offerMessage.answer }).catch(() => reject(new Error('Ongeldig antwoord')));
        }
        if (offerMessage.type === 'candidate') peerConnection.addIceCandidate(withMediaId(offerMessage.candidate)).catch(() => undefined);
        if (offerMessage.type === 'error') reject(new Error(offerMessage.message));
      };

      sendOffer(peerConnection, websocket, entityId, handleOfferMessage)
        .then((stopListening) => {
          stopListeningToHa = stopListening;
          // Closed while the offer was on its way: stop listening right away.
          if (isClosed) stopListening().catch(() => undefined);
        })
        .catch(reject);
    });
  } catch (error) {
    close();
    throw error;
  }

  // From here on, the video plays: a drop has to be reported.
  peerConnection.onconnectionstatechange = () => {
    const hasDropped = peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected';
    if (hasDropped) onDropped();
  };

  return { videoStream, route: () => routeOf(peerConnection), close };
}

/** The ICE servers from HA, including Nabu Casa's relay, and a data channel when the camera wants one. */
function getClientConfig(hass: HomeAssistant, entityId: string) {
  return hass.callWS<{ configuration: RTCConfiguration; dataChannel?: string }>({
    type: 'camera/webrtc/get_client_config',
    entity_id: entityId,
  });
}

/** A connection that only receives: the camera's video and audio. */
function createReceivingConnection(clientConfig: { configuration: RTCConfiguration; dataChannel?: string }) {
  const peerConnection = new RTCPeerConnection(clientConfig.configuration);
  if (clientConfig.dataChannel) peerConnection.createDataChannel(clientConfig.dataChannel);
  peerConnection.addTransceiver('audio', { direction: 'recvonly' });
  peerConnection.addTransceiver('video', { direction: 'recvonly' });

  return peerConnection;
}

/** Sends the offer over HA's websocket; HA's answers arrive in `handleOfferMessage`. Returns how to stop listening. */
async function sendOffer(
  peerConnection: RTCPeerConnection,
  websocket: Connection,
  entityId: string,
  handleOfferMessage: (offerMessage: OfferMessage) => void,
) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  return websocket.subscribeMessage<OfferMessage>(handleOfferMessage, { type: 'camera/webrtc/offer', entity_id: entityId, offer: offer.sdp });
}

/** Our network candidates go to HA once HA has given the session an id; until then they wait. */
function createCandidateSender(hass: HomeAssistant, entityId: string) {
  let sessionId: string | undefined;
  const waitingCandidates: RTCIceCandidateInit[] = [];

  const sendToHa = (candidate: RTCIceCandidateInit) =>
    hass.callWS({ type: 'camera/webrtc/candidate', entity_id: entityId, session_id: sessionId, candidate }).catch(() => undefined);

  return {
    send(candidate: RTCIceCandidateInit) {
      if (sessionId) sendToHa(candidate);
      else waitingCandidates.push(candidate);
    },
    startSending(newSessionId: string) {
      sessionId = newSessionId;
      waitingCandidates.splice(0).forEach(sendToHa);
    },
  };
}

/** go2rtc can send a candidate without saying which media it's for; the browser needs one. */
function withMediaId(candidate: RTCIceCandidateInit): RTCIceCandidateInit {
  const hasNoMediaId = candidate.sdpMid == null && candidate.sdpMLineIndex == null;
  return hasNoMediaId ? { ...candidate, sdpMid: '0' } : candidate;
}

/** Which route the connection ended up on, from the candidate pair it chose. */
async function routeOf(peerConnection: RTCPeerConnection): Promise<WebRtcRoute | undefined> {
  const connectionStats = await peerConnection.getStats();

  let chosenPairId: string | undefined;
  connectionStats.forEach((report) => {
    if (report.type === 'transport' && report.selectedCandidatePairId) chosenPairId = report.selectedCandidatePairId;
  });
  // Firefox doesn't say which pair it chose; there, the nominated one.
  const chosenPair = chosenPairId
    ? connectionStats.get(chosenPairId)
    : [...connectionStats.values()].find((report) => report.type === 'candidate-pair' && report.nominated);
  if (!chosenPair) return undefined;

  const ourCandidateType = connectionStats.get(chosenPair.localCandidateId)?.candidateType;
  const theirCandidateType = connectionStats.get(chosenPair.remoteCandidateId)?.candidateType;
  if (ourCandidateType === 'relay' || theirCandidateType === 'relay') return 'relay';
  if (ourCandidateType === 'host' && theirCandidateType === 'host') return 'lokaal';
  return 'direct';
}
