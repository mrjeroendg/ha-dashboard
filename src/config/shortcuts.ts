import type { IconName } from '../components/Icon';
import { Entity } from './entities';
import type { RoomEntity } from './rooms';

/** A shortcut in Snel: configured like a control in a room, plus whether it's in the row on Thuis. */
export interface SnelShortcut extends RoomEntity {
  /** In the row on Thuis, five per page, at most two pages. Without it, only in "Alle". */
  onThuis?: boolean;
}

/**
 * All shortcuts (docs/design/snel-dock), as many as you like, in this order.
 * The ones with `onThuis` are in the row on Thuis; "Alle" shows every one.
 * There is no time or state logic: what you list here is what you get.
 *
 * Each one is configured exactly like a control in a room (`RoomEntity` in
 * src/config/rooms.ts) and behaves like one: in "Alle" it's the same control
 * as in a room; in the row on Thuis, a tap does that control's main thing
 * (start a scene or script, switch a light or switch on or off). `name` and
 * `icon` replace HA's name and the domain's icon. The config is separate from
 * the rooms: nothing is shared or looked up.
 *
 * Icons: sun coffee blinds leave thermometer car sofa tv moon lock power
 * window music sprout home bulb plug door monitor droplet gauge play radio
 * alert update garage garageCar bed shower up down stop star baby phone tablet
 */
export const SHORTCUTS: SnelShortcut[] = [
  { entity: Entity.PRE_SLEEP_SCENE, name: 'Pré slaapje', icon: 'baby', onThuis: true },
  { entity: Entity.GARAGE_DOOR_IMPULSE_SCRIPT, name: 'Garagedeur', icon: 'garage', onThuis: true },
  { entity: Entity.CENTRIS_LIGHT, name: 'Centris', icon: 'moon', onThuis: true },
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
