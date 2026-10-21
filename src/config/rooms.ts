import type { IconName } from '../components/Icon';

/**
 * Rooms shown in the bottom navigation, in this order. Only what's listed here
 * appears; HA areas are not used. Entities that don't exist in HA are skipped,
 * and a room with none left is hidden.
 *
 * - Controllable entities (light, switch, cover, climate, media_player, lock,
 *   scene, script) get a control; everything else (sensor, binary_sensor, …)
 *   is shown read-only. A room with only sensors is fine.
 * - Use `{ entity, name }` to give a row a shorter name than its friendly_name.
 */
export interface RoomEntity {
  entity: string;
  name?: string;
}

export interface RoomConfig {
  id: string;
  name: string;
  icon: IconName;
  /** Shown in the room summary line. */
  temperature?: string;
  entities: Array<string | RoomEntity>;
}

export const ROOMS: RoomConfig[] = [
  {
    id: 'living',
    name: 'Living',
    icon: 'sofa',
    entities: [
      { entity: 'switch.0x94a081fffe4fce2f', name: 'Staanlamp' },
      { entity: 'light.huecupboard', name: 'Hue Play Bars' }      
    ],
  }
];
