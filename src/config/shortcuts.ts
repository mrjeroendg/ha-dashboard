import type { IconName } from '../components/Icon';
import { Entity } from './entities';
import type { RoomEntity } from './rooms';

/** A shortcut in Snel that opens a sheet with these entities, e.g. a group of screens and each screen. */
export interface SnelSheetShortcut {
  /** On the tile and as the sheet's title. */
  name: string;
  icon: IconName;
  /** Each one configured and shown exactly like a control in a room. */
  sheet: RoomEntity[];
}

/**
 * A shortcut in Snel: an entity, configured like a control in a room, or a
 * sheet with several of them.
 */
export type SnelShortcut = RoomEntity | SnelSheetShortcut;

/**
 * The shortcuts on Thuis (docs/design/snel-dock), as many as you like, in this
 * order, five per page. There is no time or state logic: what you list here is
 * what you get.
 *
 * Two kinds:
 * - An entity, configured exactly like a control in a room (`RoomEntity` in
 *   src/config/rooms.ts). A tap does that control's main thing: start a scene
 *   or script, switch a light or switch on or off. For anything else (a cover,
 *   an airco), use a sheet.
 * - A sheet (`sheet`): the tile gets an orange dot, and a tap opens a sheet
 *   with these entities, each as the same control as in a room.
 *
 * `name` and `icon` replace HA's name and the domain's icon. The config is
 * separate from the rooms: nothing is shared or looked up.
 *
 * Icons: sun coffee blinds leave thermometer car sofa tv moon lock power
 * window music sprout home bulb plug door monitor droplet gauge play radio
 * alert update garage garageCar bed shower up down left right stop star baby phone
 * tablet
 */
export const SHORTCUTS: SnelShortcut[] = [
  { entity: Entity.PRE_SLEEP_SCENE, name: 'Slapen', icon: 'baby' },
  { entity: Entity.GARAGE_DOOR_IMPULSE_SCRIPT, name: 'Garagedeur', icon: 'garage' },
  { entity: Entity.CENTRIS_LIGHT, name: 'Centris', icon: 'moon' },
  {
    name: 'Screens', icon: 'sun',
    sheet: [
      {
        entity: Entity.LIVING_SCREENS_ALL,
        name: 'Alle'
      },
      {
        entity: Entity.LIVING_SCREEN_LEFT_FRONT,
        name: 'Linksvoor',
        icon: 'left',
        myPosition: Entity.LIVING_SCREEN_LEFT_FRONT_MY_POSITION,
      },
      {
        entity: Entity.LIVING_SCREEN_RIGHT_FRONT,
        name: 'Rechtsvoor',
        icon: 'right',
        myPosition: Entity.LIVING_SCREEN_RIGHT_FRONT_MY_POSITION
      },
      {
        entity: Entity.LIVING_SCREEN_SIDE,
        name: 'Zijkant',
        myPosition: Entity.LIVING_SCREEN_SIDE_MY_POSITION
      }
    ],
  },
  {
    name: 'Covers', icon: 'blinds',
    sheet: [
      {
        entity: Entity.ALL_ROLLER_SHUTTERS,
        name: 'Alle',
        icon: 'home',
      },
      {
        entity: Entity.MASTER_BEDROOM_ROLLER_SHUTTER,
        name: 'Slaapkamer',
        icon: 'moon',
        myPosition: Entity.MASTER_BEDROOM_ROLLER_SHUTTER_MY_POSITION
      },
      {
        entity: Entity.BUREAU_ROLLER_SHUTTER,
        name: 'Bureau',
        icon: 'monitor',
        myPosition: Entity.BUREAU_ROLLER_SHUTTER_MY_POSITION
      },
      {
        entity: Entity.MARIELOU_ROLLER_SHUTTER,
        name: 'Marielou',
        icon: 'baby',
        myPosition: Entity.MARIELOU_ROLLER_SHUTTER_MY_POSITION
      },

      {
        entity: Entity.GUEST_ROOM_ROLLER_SHUTTER,
        name: 'Gasten',
        icon: 'bed',
        myPosition: Entity.GUEST_ROOM_ROLLER_SHUTTER_MY_POSITION
      },
      {
        entity: Entity.BATHROOM_VELUX,
        name: 'Badkamer',
        icon: 'shower',
        myPosition: Entity.BATHROOM_VELUX_MY_POSITION
      },

    ],
  },
];

/**
 * A small "Snel" card in a room tab (docs/design/screens-snel), e.g. "Alles
 * open": calls `<domain>.<service>` on the entity.
 *
 * - service: defaults to "turn_on"; e.g. "open_cover" for a group of screens.
 */
export interface Shortcut {
  label: string;
  icon: IconName;
  entity: Entity;
  service?: string;
}
