/**
 * Entities the dashboard should never count or show automatically, e.g. the
 * LED ring of a UniFi access point that HA exposes as a light.
 *
 * Applies to everything that scans *all* entities: the status line in the
 * header (lights on, open doors/windows, people home) and the "Raam open"
 * quick action. Rooms and other quick actions only use entities you list
 * yourself, so they don't need this.
 *
 * Use exact entity IDs.
 */
export const IGNORED_ENTITIES: string[] = [
  'light.u7_pro_wall_led',
];

export function isIgnored(entityId: string): boolean {
  return IGNORED_ENTITIES.includes(entityId);
}
