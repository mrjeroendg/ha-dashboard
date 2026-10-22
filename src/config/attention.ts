import type { IconName } from '../components/Icon';

/**
 * Warnings on Thuis, under the status line (docs/design/attention-banner).
 * A warning shows while its entity is in one of the `when` states, and can't
 * be closed: it goes away by itself once the cause is gone.
 *
 * - entity: the exact entity ID. One rule per entity.
 * - level: 'high' (dark red: safety, damage), 'medium' (red: today),
 *          'low' (orange: maintenance, e.g. updates).
 * - when: states that trigger it. Default: 'open'/'opening' for a cover,
 *         'unlocked'/'open' for a lock, otherwise 'on'.
 * - title / icon: defaults come from the entity (updates: "Update voor Immich").
 */
export type AttentionLevel = 'high' | 'medium' | 'low';

export interface AttentionRule {
  entity: string;
  level: AttentionLevel;
  when?: string[];
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
    level: 'media',
    title: 'Immich update'
  },
  {
    entity: 'update.garage_paperless_software',
    level: 'low',
    title: 'Paperless update'
  } 
];
