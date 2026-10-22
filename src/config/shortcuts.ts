import type { IconName } from '../components/Icon';

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
 */
export interface Shortcut {
  label: string;
  icon: IconName;
  entity: string;
  service?: string;
  detail?: string;
}

export const SHORTCUTS: Shortcut[] = [
  { label: 'Garagedeur', icon: 'sofa', entity: 'script.garage_door_toggle' },
  { label: 'Staanlamp', icon: 'bulb', entity: 'switch.0x94a081fffe4fce2f', service: 'toggle' },
  { label: 'Centris', icon: 'moon', entity: 'light.centris', service: 'toggle' },
  { label: 'Sfeer', icon: 'sofa', entity: 'scene.living_mood_lighting' },
];
