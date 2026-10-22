import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { CAMERAS, type Camera } from '../config/cameras';
import type { HomeAssistant } from '../types/hass';

/** The Frigate integration's instance id: its MQTT client id, "frigate" by default. */
const FRIGATE_INSTANCE = 'frigate';

const LABELS: Record<string, string> = {
  person: 'Persoon',
  car: 'Auto',
  bicycle: 'Fiets',
  motorcycle: 'Motor',
  dog: 'Hond',
  cat: 'Kat',
  bird: 'Vogel',
  package: 'Pakje',
};

export interface CameraEvent {
  id: string;
  label: string;
  time: string;
  thumbnail?: string;
}

interface FrigateEvent {
  id: string;
  label: string;
  start_time: number;
}

/** "19:42", or "19:42:08" with seconds. */
export const clock = (date: Date, seconds = false) =>
  date.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: seconds ? '2-digit' : undefined });

/** The configured cameras that exist in HA, in config order. */
export const camerasIn = (states: HassEntities): Camera[] => CAMERAS.filter((c) => c.entity in states);

const absolute = (hass: HomeAssistant, path: string) => (hass.hassUrl ? hass.hassUrl(path) : path);

/** The camera's still image (`entity_picture`), with `stamp` to get a fresh one. */
export function stillUrl(hass: HomeAssistant, entity: HassEntity, stamp: number): string | undefined {
  const picture = entity.attributes.entity_picture;
  if (!picture) return undefined;
  const url = absolute(hass, String(picture));
  return `${url}${url.includes('?') ? '&' : '?'}t=${stamp}`;
}

/** HA's MJPEG stream: works in an <img> in every browser, using the entity's access token. */
export function mjpegUrl(hass: HomeAssistant, entity: HassEntity): string | undefined {
  const token = entity.attributes.access_token;
  return token ? absolute(hass, `/api/camera_proxy_stream/${entity.entity_id}?token=${token}`) : undefined;
}

/** Safari and the iOS Companion app play HLS in a plain <video>; most desktop browsers don't. */
export const canPlayHls = () => document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';

/** The device or browser, for the stream status: "iOS", "Chrome", … */
export function platformName(): string {
  const ua = navigator.userAgent;
  const iPadAsMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadAsMac) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'browser';
}

/** Ask HA for an HLS stream of the camera (needs the `stream` integration). */
export async function hlsUrl(hass: HomeAssistant, entityId: string): Promise<string> {
  const { url } = await hass.callWS<{ url: string }>({ type: 'camera/stream', entity_id: entityId, format: 'hls' });
  return absolute(hass, url);
}

/** An action button: start the script, or trigger the automation. */
export function runCameraAction(hass: HomeAssistant, script: string) {
  const domain = script.split('.')[0];
  const service = domain === 'automation' ? 'trigger' : 'turn_on';
  return hass.callService(domain, service, {}, { entity_id: script });
}

/** A path HA accepts without a login header, so an <img> can load it. */
async function signedUrl(hass: HomeAssistant, path: string) {
  const signed = await hass.callWS<{ path: string }>({ type: 'auth/sign_path', path, expires: 3600 });
  return absolute(hass, signed.path);
}

/** Today's Frigate events for a camera, newest first, with a snapshot thumbnail each. */
export async function todaysEvents(hass: HomeAssistant, frigateCamera: string): Promise<CameraEvent[]> {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const response = await hass.callWS<FrigateEvent[] | string>({
    type: 'frigate/events/get',
    instance_id: FRIGATE_INSTANCE,
    cameras: [frigateCamera],
    after: Math.floor(midnight.getTime() / 1000),
    limit: 50,
  });
  // The integration passes Frigate's JSON through as text.
  const events: FrigateEvent[] = typeof response === 'string' ? JSON.parse(response) : response;

  return Promise.all(
    events
      .sort((a, b) => b.start_time - a.start_time)
      .map(async (e) => {
        const label = LABELS[e.label] ?? e.label.charAt(0).toUpperCase() + e.label.slice(1);
        const time = clock(new Date(e.start_time * 1000));
        const thumbnail = await signedUrl(hass, `/api/frigate/${FRIGATE_INSTANCE}/thumbnail/${e.id}`).catch(() => undefined);

        return { id: e.id, label, time, thumbnail };
      }),
  );
}
