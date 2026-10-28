import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { CAMERAS, type Camera } from '../config/cameras';
import type { HomeAssistant } from '../types/hass';

/** The configured cameras that exist in HA, in config order. */
export function configuredCameras(states: HassEntities): Camera[] {
  return CAMERAS.filter((camera) => camera.entity in states);
}

/** An HA path as a full address: HA's own pages use the path as it is, dev mode needs HA's address in front. */
function haAddress(hass: HomeAssistant, path: string): string {
  return hass.hassUrl ? hass.hassUrl(path) : path;
}

/** The camera's still image (`entity_picture`). A new `refreshStamp` makes the browser fetch a fresh one. */
export function stillImageUrl(hass: HomeAssistant, cameraEntity: HassEntity, refreshStamp: number): string | undefined {
  const picture = cameraEntity.attributes.entity_picture;
  if (!picture) return undefined;

  const pictureUrl = haAddress(hass, String(picture));
  const separator = pictureUrl.includes('?') ? '&' : '?';

  return `${pictureUrl}${separator}t=${refreshStamp}`;
}

/** The ways HA can stream this camera to a browser, e.g. `['web_rtc', 'hls']`; none when HA doesn't answer. */
export async function streamTypes(hass: HomeAssistant, entityId: string): Promise<string[]> {
  try {
    const capabilities = await hass.callWS<{ frontend_stream_types: string[] }>({ type: 'camera/capabilities', entity_id: entityId });
    return capabilities.frontend_stream_types;
  } catch {
    return [];
  }
}

/** Safari and the iOS Companion app play HLS in a plain `<video>`; most other browsers don't. */
export function canPlayHls(): boolean {
  return document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== '';
}

/** Asks HA for an HLS stream of the camera (needs HA's `stream` integration). */
export async function hlsUrl(hass: HomeAssistant, entityId: string): Promise<string> {
  const hlsStream = await hass.callWS<{ url: string }>({ type: 'camera/stream', entity_id: entityId, format: 'hls' });
  return haAddress(hass, hlsStream.url);
}

/** HA's MJPEG stream, for an `<img>`: works in every browser, with the camera's current access token. */
export function mjpegUrl(hass: HomeAssistant, cameraEntity: HassEntity): string | undefined {
  const accessToken = cameraEntity.attributes.access_token;
  if (!accessToken) return undefined;

  return haAddress(hass, `/api/camera_proxy_stream/${cameraEntity.entity_id}?token=${accessToken}`);
}
