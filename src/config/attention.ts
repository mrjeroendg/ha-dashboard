import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';

/**
 * Warnings on Thuis, under the status line (docs/design/attention-banner).
 * A warning shows while its entity is in one of the `when` states, and can't
 * be closed: it goes away by itself once the cause is gone.
 *
 * - entity: the exact entity ID. One rule per entity.
 * - level: 'high' (dark red: safety, damage), 'medium' (red: today),
 *          'low' (orange: maintenance, e.g. updates).
 * - when: states that trigger it, e.g. ['open']. Default: 'open'/'opening' for
 *         a cover, 'unlocked'/'open' for a lock, otherwise 'on'.
 *         Or a function that gets the entity (and all states, to look at
 *         other entities) and returns true to show the warning, e.g. a low
 *         battery: (e) => Number(e.state) <= 20.
 * - title / icon: defaults come from the entity (updates: "Update voor Immich").
 * - detail: a function that gets the entity and returns the second line, e.g.
 *           (e) => `${e.state}%`. Default: "Sinds 14:02", or the versions for
 *           an update.
 */
export type AttentionLevel = 'high' | 'medium' | 'low';

export interface AttentionRule {
  entity: string;
  level: AttentionLevel;
  when?: string[] | ((entity: HassEntity, states: HassEntities) => boolean);
  title?: string;
  icon?: IconName;
  detail?: (entity: HassEntity, states: HassEntities) => string;
}

/** Battery at 20% or less, unless its `…_battery_state` sensor says it's charging. */
const lowBattery = (stateSensor: string) => (e: HassEntity, states: HassEntities) =>
  Number(e.state) <= 20 && states[stateSensor]?.state !== 'Charging';

export const ATTENTION: AttentionRule[] = [
  {
    entity: 'sensor.garage_door_state_classification',
    level: 'high',
    when: ['open'],
    title: 'Garagepoort staat open',
    icon: 'garage'
  },
  {
    entity: 'update.irpi_admin_version',
    level: 'low',
    title: 'Immich update'
  },
  {
    entity: 'update.garage_paperless_software',
    level: 'low',
    title: 'Paperless update'
  },
  {
    entity: 'sensor.jeroens_ipad_battery_level',
    level: 'low',
    title: 'iPad bijna leeg',
    icon: 'tablet',
    when: lowBattery('sensor.jeroens_ipad_battery_state'),
    detail: (e) => `${e.state}%`,
  },
  {
    entity: 'sensor.iphone_16_pro_battery_level',
    level: 'low',
    title: 'iPhone bijna leeg',
    icon: 'phone',
    when: lowBattery('sensor.iphone_16_pro_battery_state'),
    detail: (e) => `${e.state}%`,
  },
];
