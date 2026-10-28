import type { IconName } from '../components/Icon';
import { Entity } from './entities';
import type { RoomEntity } from './rooms';

/**
 * Snel on Thuis (docs/design/snel-list), shown in this order, always. There is
 * no time or state logic: what you list here is what you get.
 *
 * Each one is configured exactly like a control in a room (`RoomEntity` in
 * src/config/rooms.ts) and becomes the same control: "Start" for a scene or
 * script, a switch for a light or switch, the light sheet for a light with
 * `members`, and so on. `name` and `icon` replace HA's name and the domain's icon.
 * The config is separate from the rooms: nothing is shared or looked up.
 *
 * Icons: sun coffee blinds leave thermometer car sofa tv moon lock power
 * window music sprout home bulb plug door monitor droplet gauge play radio
 * alert update garage garageCar bed shower up down stop star baby phone tablet
 */
export const SHORTCUTS: RoomEntity[] = [
  { entity: Entity.PRE_SLEEP_SCENE, name: 'Pré slaapje', icon: 'baby' },
  { entity: Entity.GARAGE_DOOR_IMPULSE_SCRIPT, name: 'Garagedeur', icon: 'garage' },
  { entity: Entity.CENTRIS_LIGHT, name: 'Centris', icon: 'moon' }
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
