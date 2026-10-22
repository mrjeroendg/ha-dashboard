import type { IconName } from '../components/Icon';

/**
 * Warnings on Thuis, under the status line (docs/design/attention-banner).
 * A warning shows while its entity is in one of the `when` states, and can't
 * be closed: it goes away by itself once the cause is gone.
 *
 * - entity: exact ID, or `*` as a wildcard ('update.*' = every update).
 * - level: 'high' (dark red: safety, damage), 'medium' (red: today),
 *          'low' (orange: maintenance, e.g. updates).
 * - when: states that trigger it. Default: 'open'/'opening' for a cover,
 *         'unlocked'/'open' for a lock, otherwise 'on'.
 * - title / icon: defaults come from the entity (updates: "Update voor Immich").
 *
 * Entities in src/config/ignore.ts are skipped.
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
    title: 'Immich update beschikbaar'
  },
  {
    entity: 'update.irpi_admin_version',
    level: 'low',
    title: 'Immich update beschikbaar'
  }
];
