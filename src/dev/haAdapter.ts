import {
  callService,
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  type Connection,
  type HassEntities,
} from 'home-assistant-js-websocket';
import type { HomeAssistant } from '../types/hass';

/**
 * DEV ONLY. Connects to HA with a long-lived token and keeps a `hass` object
 * that mimics the one HA hands to cards. A fresh object is emitted on every
 * change so React sees a new reference, just like in production.
 */
export async function connectHass(
  url: string,
  token: string,
  onChange: (hass: HomeAssistant) => void,
): Promise<Connection> {
  const auth = createLongLivedTokenAuth(url, token);
  const conn = await createConnection({ auth });

  const callWS = <T,>(msg: { type: string; [key: string]: unknown }) =>
    conn.sendMessagePromise<T>(msg);

  const user = await callWS<{ id: string; name: string; is_admin: boolean }>({
    type: 'auth/current_user',
  });

  const build = (states: HassEntities): HomeAssistant => ({
    states,
    user,
    language: 'nl',
    hassUrl: (path = '') => (path.startsWith('http') ? path : `${url.replace(/\/$/, '')}${path}`),
    callService: (domain, service, serviceData, target) =>
      callService(conn, domain, service, serviceData, target),
    callWS,
    connection: conn,
  });

  subscribeEntities(conn, (states) => onChange(build(states)));
  return conn;
}
