import type { IconName } from '../components/Icon';
import type { Shortcut } from './shortcuts';
import { Entity } from './entities';

/** One control: in a room, and the same config for Snel on Thuis (src/config/shortcuts.ts). */
export interface RoomEntity {
  entity: Entity;
  name?: string;
  /** Instead of the icon that goes with the entity's domain. */
  icon?: IconName;
  allowUnknownState?: boolean;
  myPosition?: Entity;
  simple?: boolean;
  members?: RoomLightMember[];
}

export interface RoomLightMember {
  entity: Entity;
  name: string;
}

export interface RoomSafety {
  entity: Entity;
  name?: string;
  battery?: Entity;
}

export interface RoomSection {
  title: string;
  shortcuts?: Shortcut[];
  entities: Array<Entity | RoomEntity>;
}

interface RoomBase {
  id: string;
  name: string;
  icon: IconName;
  temperature?: Entity;
  humidity?: Entity;
  safety?: Array<Entity | RoomSafety>;
}

export type RoomConfig =
  | (RoomBase & { entities: Array<Entity | RoomEntity>; sections?: never })
  | (RoomBase & { sections: RoomSection[]; entities?: never });

export const ROOMS: RoomConfig[] = [
  {
    id: 'living',
    name: 'Living',
    icon: 'sofa',
    safety: [
      { entity: Entity.LIVING_FRONT_DOOR_CONTACT, 'name': 'Voordeur' },
      { entity: Entity.LIVING_SLIDING_WINDOW_CONTACT, 'name': 'Schuifraam' }
    ],
    sections: [
      {
        title: "Verlichting",
        entities: [
          { entity: Entity.LIVING_FLOOR_LAMP, name: 'Staanlamp' },
          {
            entity: Entity.LIVING_CUPBOARD_LIGHTS,
            name: 'CB3',
            members: [
              { entity: Entity.LIVING_CUPBOARD_LIGHT_LEFT, name: 'Links' },
              { entity: Entity.LIVING_CUPBOARD_LIGHT_RIGHT, name: 'Rechts' }
            ]
          },
        ],
      },
      {
        title: "Screens",
        shortcuts: [
          { label: 'Alles open', icon: 'up', entity: Entity.LIVING_SCREENS_ALL, service: 'open_cover' },
          { label: 'Alles dicht', icon: 'down', entity: Entity.LIVING_SCREENS_ALL, service: 'close_cover' }
        ],
        entities: [
          { entity: Entity.LIVING_SCREEN_LEFT_FRONT, name: 'Linksvoor', myPosition: Entity.LIVING_SCREEN_LEFT_FRONT_MY_POSITION },
          { entity: Entity.LIVING_SCREEN_RIGHT_FRONT, name: 'Rechtsvoor', myPosition: Entity.LIVING_SCREEN_RIGHT_FRONT_MY_POSITION },
          { entity: Entity.LIVING_SCREEN_SIDE, name: 'Zijkant', myPosition: Entity.LIVING_SCREEN_SIDE_MY_POSITION }
        ],
      }
    ],
  },
  {
    id: 'master-bedroom',
    name: "Slaapkamer",
    icon: 'moon',
    temperature: Entity.MASTER_BEDROOM_TEMPERATURE,
    safety: [
      {
        entity: Entity.MASTER_BEDROOM_SMOKE_DETECTOR,
        'name': 'Rookmelder',
        battery: Entity.MASTER_BEDROOM_SMOKE_DETECTOR_BATTERY
      },
    ],
    entities: [
      { entity: Entity.MASTER_BEDROOM_AIRCO, name: 'Airco' },
      { entity: Entity.MASTER_BEDROOM_ROLLER_SHUTTER, name: 'Rolluik', myPosition: Entity.MASTER_BEDROOM_ROLLER_SHUTTER_MY_POSITION }
    ],
  },
  {
    id: 'marielou',
    name: "Marielou",
    icon: 'baby',
    temperature: Entity.MARIELOU_TEMPERATURE,
    humidity: Entity.MARIELOU_HUMIDITY,
    entities: [
      { entity: Entity.MARIELOU_HERSTAL_LIGHT, name: 'Herstal' },
      { entity: Entity.MARIELOU_AIRCO, name: 'Airco' },
      { entity: Entity.MARIELOU_ROLLER_SHUTTER, name: 'Rolluik', myPosition: Entity.MARIELOU_ROLLER_SHUTTER_MY_POSITION }
    ],
  },
  {
    id: 'garage',
    name: "Garage",
    icon: 'garageCar',
    safety: [
      { entity: Entity.GARAGE_SMOKE_DETECTOR, name: 'Rookmelder', battery: Entity.GARAGE_SMOKE_DETECTOR_BATTERY }
    ],
    entities: [
      { entity: Entity.GARAGE_STORAGE_LIGHT, name: 'Berging' },
      { entity: Entity.GARAGE_DOOR_IMPULSE_SCRIPT, name: 'Garagedeur' }
    ],
  },
  {
    id: 'bureau',
    name: "Bureau",
    icon: 'monitor',
    temperature: Entity.BUREAU_TEMPERATURE,
    humidity: Entity.BUREAU_HUMIDITY,
    safety: [
      { entity: Entity.BUREAU_SMOKE_DETECTOR, name: 'Rookmelder', battery: Entity.BUREAU_SMOKE_DETECTOR_BATTERY }
    ],
    entities: [
      {
        entity: Entity.BUREAU_CEILING_LIGHT,
        name: 'Plafondlamp',
        members: [
          { entity: Entity.BUREAU_CEILING_LIGHT_RING, name: 'Ring' },
          { entity: Entity.BUREAU_CEILING_LIGHT_LAMP, name: 'Lamp' }
        ]
      },
      { entity: Entity.BUREAU_ROLLER_SHUTTER, name: 'Rolluik', myPosition: Entity.BUREAU_ROLLER_SHUTTER_MY_POSITION }
    ],
  },
  {
    id: 'gasten',
    name: "Gasten",
    icon: 'bed',
    safety: [
      {
        entity: Entity.GUEST_ROOM_SMOKE_DETECTOR, name: 'Rookmelder',
        battery: Entity.GUEST_ROOM_SMOKE_DETECTOR_BATTERY
      }
    ],
    entities: [
      { entity: Entity.GUEST_ROOM_AIRCO, name: 'Airco' },
      { entity: Entity.GUEST_ROOM_ROLLER_SHUTTER, name: 'Rolluik', myPosition: Entity.GUEST_ROOM_ROLLER_SHUTTER_MY_POSITION }
    ],
  },
  {
    id: 'badkamer',
    name: "Badkamer",
    icon: 'shower',
    entities: [
      { entity: Entity.BATHROOM_VELUX, name: 'Velux', myPosition: Entity.BATHROOM_VELUX_MY_POSITION }
    ],
  }
];
