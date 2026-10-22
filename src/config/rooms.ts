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
 * - List `entities` for one plain list, or `sections` to split the room into
 *   tabs (docs/design/room-tabs-airco), e.g.
 *     sections: [
 *       { title: 'Verlichting', entities: ['light.a', 'light.b'] },
 *       { title: 'Klimaat', entities: ['climate.airco', 'sensor.vochtigheid'] },
 *     ]
 *   The room opens on the first tab. Empty sections are hidden, and with only
 *   one section left there are no tabs.
 */
export interface RoomEntity {
  entity: string;
  name?: string;
}

export interface RoomSection {
  title: string;
  entities: Array<string | RoomEntity>;
}

interface RoomBase {
  id: string;
  name: string;
  icon: IconName;
}

export type RoomConfig =
  | (RoomBase & { entities: Array<string | RoomEntity>; sections?: never })
  | (RoomBase & { sections: RoomSection[]; entities?: never });

export const ROOMS: RoomConfig[] = [
  {
    id: 'living',
    name: 'Living',
    icon: 'sofa',
    sections: [
      {
        title: "Verlichting",
        entities: [
          { entity: 'switch.0x94a081fffe4fce2f', name: 'Staanlamp' },
          { entity: 'light.huecupboard', name: 'Hue Play Bars' }
        ],
      },
      {
        title: "Screens",
        entities: [
          { entity: 'cover.rts_16750040', name: 'Screen linksvoor' }
        ],
      }
    ],
  }
];
