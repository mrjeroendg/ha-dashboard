import type { HassEntity } from 'home-assistant-js-websocket';
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
 *         Or a function that gets the entity and returns true to show the
 *         warning, e.g. a low battery: (e) => Number(e.state) <= 20.
 * - title / icon: defaults come from the entity (updates: "Update voor Immich").
 */
export type AttentionLevel = 'high' | 'medium' | 'low';

export interface AttentionRule {
  entity: string;
  level: AttentionLevel;
  when?: string[] | ((entity: HassEntity) => boolean);
  title?: string;
  icon?: IconName;
}

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
    when: (e) => Number(e.state) <= 20,
  },
  {
    entity: 'sensor.iphone_16_pro_battery_level',
    level: 'low',
    title: 'iPhone bijna leeg',
    icon: 'phone',
    when: (e) => Number(e.state) <= 20,
  },
];
