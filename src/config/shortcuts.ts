import type { IconName } from '../components/Icon';

/**
 * Shortcuts on Thuis ("Snel"), shown in this order, always. There is no time
 * or state logic: what you list here is what you get.
 *
 * - entity: what to act on, e.g. a script, scene, light or switch. On Thuis it
 *   becomes the same control as in a room (docs/design/snel-list): "Start" for
 *   a scene or script, a switch for a light or switch.
 * - service: only for Snel in a room tab (e.g. "open_cover" for "Alles open");
 *   defaults to "turn_on". On Thuis the entity's domain decides what a tap does.
 *
 * Icons: sun coffee blinds leave thermometer car sofa tv moon lock power
 * window music sprout home bulb plug door monitor droplet gauge play radio
 * alert update garage garageCar bed shower up down stop star baby phone tablet
 */
export interface Shortcut {
  label: string;
  icon: IconName;
  entity: string;
  service?: string;
}

export const SHORTCUTS: Shortcut[] = [
  { label: 'Pré slaapje', icon: 'baby', entity: 'scene.pre_sleep' },
  { label: 'Garagedeur', icon: 'garage', entity: 'script.garage_door_impuls' },
  // { label: 'Staanlamp', icon: 'bulb', entity: 'switch.0x94a081fffe4fce2f', service: 'toggle' },
  { label: 'Centris', icon: 'moon', entity: 'light.centris' },
  { label: 'Sfeer', icon: 'sofa', entity: 'scene.living_mood_lighting' }
];
