import type { IconName } from '../components/Icon';
import { Entity } from './entities';

/**
 * Shortcuts on Thuis ("Snel"), shown in this order, always. There is no time
 * or state logic: what you list here is what you get.
 *
 * - entity: what to act on, e.g. a script, scene, light or switch.
 * - service: defaults to "turn_on" (start a script/scene, switch something on).
 *   Use e.g. "toggle" for a light or switch you want to flip.
 * - detail: optional second line on the card.
 *
 * Icons: sun coffee blinds leave thermometer car sofa tv moon lock power
 * window music sprout home bulb plug door monitor droplet gauge play radio
 * alert update garage garageCar bed shower up down stop star baby phone tablet
 */
export interface Shortcut {
  label: string;
  icon: IconName;
  entity: Entity;
  service?: string;
  detail?: string;
}

export const SHORTCUTS: Shortcut[] = [
  { label: 'Pré slaapje', icon: 'baby', entity: Entity.PRE_SLEEP_SCENE },
  { label: 'Garagedeur', icon: 'sofa', entity: Entity.GARAGE_DOOR_IMPULSE_SCRIPT },
  // { label: 'Staanlamp', icon: 'bulb', entity: 'switch.0x94a081fffe4fce2f', service: 'toggle' },
  { label: 'Centris', icon: 'moon', entity: Entity.CENTRIS_LIGHT, service: 'toggle' },
  { label: 'Sfeer', icon: 'sofa', entity: Entity.LIVING_MOOD_LIGHTING_SCENE }
];
