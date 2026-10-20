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
    id: 'woonkamer',
    name: 'Woonkamer',
    icon: 'sofa',
    temperature: 'sensor.woonkamer_temperatuur',
    entities: [
      { entity: 'light.woonkamer', name: 'Plafond' },
      { entity: 'light.eettafel', name: 'Eettafel' },
      { entity: 'cover.rolluiken', name: 'Rolluiken' },
      { entity: 'climate.woonkamer', name: 'Verwarming' },
      { entity: 'media_player.woonkamer', name: 'Speaker' },
    ],
  },
  {
    id: 'keuken',
    name: 'Keuken',
    icon: 'coffee',
    entities: [
      { entity: 'light.keuken', name: 'Plafond' },
      { entity: 'switch.koffiemachine', name: 'Koffiemachine' },
    ],
  },
  {
    id: 'inkom',
    name: 'Inkom',
    icon: 'door',
    entities: [
      { entity: 'light.gang', name: 'Gang' },
      { entity: 'lock.voordeur', name: 'Voordeur' },
    ],
  },
  {
    id: 'bureau',
    name: 'Bureau',
    icon: 'monitor',
    entities: [{ entity: 'light.bureau', name: 'Bureaulamp' }],
  },
  {
    id: 'slaapkamer',
    name: 'Slaapkamer',
    icon: 'moon',
    temperature: 'sensor.slaapkamer_temperatuur',
    entities: [{ entity: 'light.slaapkamer', name: 'Plafond' }, 'sensor.slaapkamer_temperatuur'],
  },
  {
    // Sensors only: nothing to control, just to glance at.
    id: 'badkamer',
    name: 'Badkamer',
    icon: 'droplet',
    temperature: 'sensor.badkamer_temperatuur',
    entities: [
      { entity: 'binary_sensor.raam_badkamer', name: 'Raam' },
      { entity: 'sensor.badkamer_vochtigheid', name: 'Vochtigheid' },
      { entity: 'sensor.badkamer_temperatuur', name: 'Temperatuur' },
    ],
  },
];
