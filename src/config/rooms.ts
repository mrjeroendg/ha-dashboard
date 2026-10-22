import type { IconName } from '../components/Icon';
import type { Shortcut } from './shortcuts';

/**
 * Rooms shown in the bottom navigation, in this order. Only what's listed here
 * appears; HA areas are not used. Entities that don't exist in HA are skipped,
 * and a room with none left is hidden.
 *
 * - Controllable entities (light, switch, cover, climate, media_player, lock,
 *   scene, script) get a control; everything else (sensor, binary_sensor, …)
 *   is shown read-only. A room with only sensors is fine.
 * - Use `{ entity, name }` to give a row a shorter name than its friendly_name.
 * - `temperature` / `humidity`: sensors shown in the room's header, e.g.
 *   temperature: 'sensor.bureau_temperatuur', humidity: 'sensor.bureau_vochtigheid'
 *   (docs/design/room-header). Both optional; missing or unavailable ones are left out.
 * - Add `simple: true` to a light you only switch on and off: no brightness
 *   slider and no colours, even if the light supports them.
 * - Add `allowUnknownState: true` for e.g. an RTS screen: those never report
 *   their position, so their state stays 'unknown'. They still get a control
 *   (shown as off/closed); any other entity in 'unknown' is shown as
 *   "Niet beschikbaar".
 * - Covers (cover.*) get buttons instead of a switch: up, stop, down
 *   (docs/design/screens-snel). Add `myPosition: 'button.…'` for an RTS
 *   screen's "My position" button: that adds a ★ between up and stop.
 * - List `entities` for one plain list, or `sections` to split the room into
 *   tabs (docs/design/room-tabs-airco), e.g.
 *     sections: [
 *       { title: 'Verlichting', entities: ['light.a', 'light.b'] },
 *       { title: 'Klimaat', entities: ['climate.airco', 'sensor.vochtigheid'] },
 *     ]
 *   The room opens on the first tab. Empty sections are hidden, and with only
 *   one section left there are no tabs.
 * - A section can have `shortcuts`: small "Snel" cards at the top of its tab,
 *   with the same fields as src/config/shortcuts.ts, e.g.
 *     shortcuts: [{ label: 'Alles dicht', icon: 'down', entity: 'script.screens_dicht' }]
 */
export interface RoomEntity {
  entity: string;
  name?: string;
  /** Show a control even while the state is 'unknown' (e.g. RTS screens). */
  allowUnknownState?: boolean;
  /** Cover only: the "My position" button entity of an RTS screen (adds ★). */
  myPosition?: string;
  /** Light only: just the on/off switch, without brightness slider or colours. */
  simple?: boolean;
}

export interface RoomSection {
  title: string;
  /** Small "Snel" cards at the top of the tab. */
  shortcuts?: Shortcut[];
  entities: Array<string | RoomEntity>;
}

interface RoomBase {
  id: string;
  name: string;
  icon: IconName;
  /** Temperature sensor shown large next to the room name. */
  temperature?: string;
  /** Humidity sensor shown under the temperature. */
  humidity?: string;
}

export type RoomConfig =
  | (RoomBase & { entities: Array<string | RoomEntity>; sections?: never })
  | (RoomBase & { sections: RoomSection[]; entities?: never });

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
