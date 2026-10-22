import type { HassEntities, HassServiceTarget } from 'home-assistant-js-websocket';

/**
 * The subset of Home Assistant's `hass` object this dashboard relies on.
 * In production HA sets the full object on the custom element; in dev the
 * websocket adapter (src/dev/haAdapter.ts) builds one with the same shape.
 */
export interface HomeAssistant {
  states: HassEntities;
  user?: { id: string; name: string; is_admin: boolean };
  language?: string;
  /** Absolute URL for an HA path such as entity_picture (HA provides this too). */
  hassUrl?(path?: string): string;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: HassServiceTarget,
  ): Promise<unknown>;
  callWS<T>(msg: { type: string; [key: string]: unknown }): Promise<T>;
}

/** Card config as written in the Lovelace YAML (`type: custom:ha-dashboard`). */
export interface DashboardConfig {
  type?: string;
  /** Override the name in the greeting (defaults to the logged-in HA user). */
  name?: string;
}
