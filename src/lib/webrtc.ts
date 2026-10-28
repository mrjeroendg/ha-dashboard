import type { HomeAssistant } from '../types/hass';

/** How the WebRTC video reaches the phone: same network, through your router, or via a relay (Nabu Casa). */
export type WebRtcRoute = 'lokaal' | 'direct' | 'relay';

export interface WebRtcConnection {
  stream: MediaStream;
  route(): Promise<WebRtcRoute | undefined>;
  close(): void;
}

type OfferEvent =
  | { type: 'session'; session_id: string }
  | { type: 'answer'; answer: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit }
  | { type: 'error'; code: string; message: string };

/**
 * One WebRTC attempt through Home Assistant, the way HA's own player does it
 * (ha-web-rtc-player): the offer and candidates go over HA's websocket, the
 * video comes straight from go2rtc, or via the TURN relay HA hands out
 * (Nabu Casa). Resolves once video arrives; rejects on an error or when the
 * connection fails. `signal` aborts it.
 */
export async function connectWebRtc(hass: HomeAssistant, entityId: string, signal: AbortSignal): Promise<WebRtcConnection> {
  const connection = hass.connection;
  if (!connection) throw new Error('Geen websocket');

  const config = await hass.callWS<{ configuration: RTCConfiguration; dataChannel?: string }>({
    type: 'camera/webrtc/get_client_config',
    entity_id: entityId,
  });
  const pc = new RTCPeerConnection(config.configuration);
  if (config.dataChannel) pc.createDataChannel(config.dataChannel);
  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.addTransceiver('video', { direction: 'recvonly' });

  const stream = new MediaStream();
  let unsubscribe: (() => Promise<void>) | undefined;
  const close = () => {
    pc.close();
    unsubscribe?.().catch(() => undefined);
  };

  return new Promise<WebRtcConnection>((resolve, reject) => {
    const fail = (reason: string) => {
      close();
      reject(new Error(reason));
    };
    signal.addEventListener('abort', () => fail('Afgebroken'));

    let sessionId: string | undefined;
    const pending: RTCIceCandidateInit[] = [];
    const sendCandidate = (candidate: RTCIceCandidateInit) =>
      hass
        .callWS({ type: 'camera/webrtc/candidate', entity_id: entityId, session_id: sessionId, candidate })
        .catch(() => undefined);

    pc.onicecandidate = (e) => {
      if (!e.candidate?.candidate) return;
      const candidate = e.candidate.toJSON();
      if (sessionId) sendCandidate(candidate);
      else pending.push(candidate);
    };

    let hasVideo = false;
    let connected = false;
    const settle = () => {
      if (hasVideo && connected) resolve({ stream, route: () => routeOf(pc), close });
    };
    pc.ontrack = (e) => {
      stream.addTrack(e.track);
      if (e.track.kind === 'video') hasVideo = true;
      settle();
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        connected = true;
        settle();
      }
      if (pc.connectionState === 'failed') fail('Geen verbinding');
    };

    const onEvent = (event: OfferEvent) => {
      if (event.type === 'session') {
        sessionId = event.session_id;
        pending.splice(0).forEach(sendCandidate);
      } else if (event.type === 'answer') {
        pc.setRemoteDescription({ type: 'answer', sdp: event.answer }).catch(() => fail('Ongeldig antwoord'));
      } else if (event.type === 'candidate') {
        const candidate = event.candidate.sdpMid == null && event.candidate.sdpMLineIndex == null
          ? { ...event.candidate, sdpMid: '0' }
          : event.candidate;
        pc.addIceCandidate(candidate).catch(() => undefined);
      } else if (event.type === 'error') {
        fail(event.message);
      }
    };

    pc.createOffer()
      .then(async (offer) => {
        await pc.setLocalDescription(offer);
        unsubscribe = await connection.subscribeMessage<OfferEvent>(onEvent, {
          type: 'camera/webrtc/offer',
          entity_id: entityId,
          offer: offer.sdp,
        });
        if (signal.aborted) close();
      })
      .catch((err: Error) => fail(err.message));
  });
}

/** Which route the connection ended up on, from the selected candidate pair. */
async function routeOf(pc: RTCPeerConnection): Promise<WebRtcRoute | undefined> {
  const stats = await pc.getStats();
  let pairId: string | undefined;
  stats.forEach((s) => {
    if (s.type === 'transport' && s.selectedCandidatePairId) pairId = s.selectedCandidatePairId;
  });
  const pair = pairId ? stats.get(pairId) : [...stats.values()].find((s) => s.type === 'candidate-pair' && s.nominated);
  if (!pair) return undefined;
  const local = stats.get(pair.localCandidateId)?.candidateType;
  const remote = stats.get(pair.remoteCandidateId)?.candidateType;
  if (local === 'relay' || remote === 'relay') return 'relay';
  if (local === 'host' && remote === 'host') return 'lokaal';
  return 'direct';
}
