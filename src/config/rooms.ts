import type { IconName } from '../components/Icon';
import type { Shortcut } from './shortcuts';

export interface RoomEntity {
  entity: string;
  name?: string;
  allowUnknownState?: boolean;
  myPosition?: string;
  simple?: boolean;
  members?: RoomLightMember[];
  /** A robot lawn mower's sheet (docs/design/lawn-mower). */
  mower?: MowerConfig;
}

/** The mower's other entities, each optional: leave one out to hide its line in the sheet. */
export interface MowerConfig {
  /** The select entity that sets the zone to mow. */
  zone?: string;
  /** The zones to show, in this order: the select's option and the name on the button. */
  zones?: Array<{ option: string; name: string }>;
  battery?: string;
  charging?: string;
  rain?: string;
  /** The cloud connection, e.g. Landroid's MQTT sensor. */
  online?: string;
  error?: string;
  bladeHours?: string;
  distance?: string;
}

export interface RoomLightMember {
  entity: string;
  name: string;
}

export interface RoomSafety {
  entity: string;
  name?: string;
  battery?: string;
}

export interface RoomSection {
  title: string;
  shortcuts?: Shortcut[];
  entities: Array<string | RoomEntity>;
}

interface RoomBase {
  id: string;
  name: string;
  icon: IconName;
  temperature?: string;
  humidity?: string;
  safety?: Array<string | RoomSafety>;
}

export type RoomConfig =
  | (RoomBase & { entities: Array<string | RoomEntity>; sections?: never })
  | (RoomBase & { sections: RoomSection[]; entities?: never });

export const ROOMS: RoomConfig[] = [
  {
    id: 'living',
    name: 'Living',
    icon: 'sofa',
    safety: [
      { entity: 'binary_sensor.0x001788011004451e_contact', 'name': 'Voordeur' },
      { entity: 'binary_sensor.0x001788011004452e_contact', 'name': 'Schuifraam' }
    ],
    sections: [
      {
        title: "Verlichting",
        entities: [
          { entity: 'light.living_switch_dining_table', name: 'Staanlamp' },
          {
            entity: 'light.huecupboard',
            name: 'CB3',
            members: [
              { entity: 'light.0x001788010efb449a', name: 'Links' },
              { entity: 'light.0x001788010efb4490', name: 'Rechts' }
            ]
          },
        ],
      },
      {
        title: "Screens",
        shortcuts: [
          { label: 'Alles open', icon: 'up', entity: 'cover.screen_side_facade', service: 'open_cover' },
          { label: 'Alles dicht', icon: 'down', entity: 'cover.screen_side_facade', service: 'close_cover' }
        ],
        entities: [
          { entity: 'cover.rts_16774497', name: 'Linksvoor', myPosition: 'button.rts_16774497_my_position' },
          { entity: 'cover.rts_16740619', name: 'Rechtsvoor', myPosition: 'button.rts_16740619_my_position' },
          { entity: 'cover.rts_16750040', name: 'Zijkant', myPosition: 'button.rts_16750040_my_position' }
        ],
      }
    ],
  },
  {
    id: 'master-bedroom',
    name: "Slaapkamer",
    icon: 'moon',
    temperature: 'sensor.master_bedroom_airco_room_temperature',
    safety: [
      {
        entity: 'binary_sensor.0x0015bc003106379c_smoke',
        'name': 'Rookmelder',
        battery: 'sensor.0x0015bc003106379c_battery'
      },
    ],
    entities: [
      // docs/design/airco-sheet
      { entity: 'climate.master_bedroom_airco', name: 'Airco' },
      { entity: 'cover.rts_16727506', name: 'Rolluik', myPosition: 'button.rts_16727506_my_position' }
    ],
  },
  {
    id: 'marielou',
    name: "Marielou",
    icon: 'baby',
    temperature: 'sensor.0xf044d3fffecd20d8_temperature',
    humidity: 'sensor.0xf044d3fffecd20d8_humidity',
    entities: [
      { entity: 'light.bedroom_marielou_herstal_light_switch', name: 'Herstal' },
      // docs/design/airco-sheet
      { entity: 'climate.bedroom_marielou_airco', name: 'Airco' },
      { entity: 'cover.rts_16767817', name: 'Rolluik', myPosition: 'button.rts_16767817_my_position' }
    ],
  },
  {
    id: 'garage',
    name: "Garage",
    icon: 'garageCar',
    safety: [
      { entity: 'binary_sensor.0x0015bc003106405f_smoke', name: 'Rookmelder', battery: 'sensor.0x0015bc003106405f_battery' }
    ],
    entities: [
      { entity: 'light.storage_switch', name: 'Berging' },
      { entity: 'script.garage_door_impuls', name: 'Garagedeur' }
    ],
  },
  {
    id: 'bureau',
    name: "Bureau",
    icon: 'monitor',
    temperature: 'sensor.0x7c3e822f69dd0000_temperature',
    humidity: 'sensor.0x7c3e822f69dd0000_humidity',
    safety: [
      { entity: 'binary_sensor.0x0015bc003106406b_smoke', name: 'Rookmelder', battery: 'sensor.0x0015bc003106406b_battery' }
    ],
    entities: [
      {
        entity: 'light.ceiling_light',
        name: 'Plafondlamp',
        members: [
          { entity: 'light.0x54ef4410012089f2_rgb', name: 'Ring' },
          { entity: 'light.0x54ef4410012089f2_white', name: 'Lamp' }
        ]
      },
      { entity: 'cover.rts_16765494', name: 'Rolluik', myPosition: 'button.rts_16765494_my_position' }
    ],
  },
  {
    id: 'gasten',
    name: "Gasten",
    icon: 'bed',
    safety: [
      {
        entity: 'binary_sensor.0x0015bc003106405c_smoke', name: 'Rookmelder',
        battery: 'sensor.0x0015bc003106405c_battery'
      }
    ],
    entities: [
      // docs/design/airco-sheet
      { entity: 'climate.guest_room_airco', name: 'Airco' },
      { entity: 'cover.rts_16722417', name: 'Rolluik', myPosition: 'button.rts_16722417_my_position' }
    ],
  },
  {
    id: 'badkamer',
    name: "Badkamer",
    icon: 'shower',
    entities: [
      { entity: 'cover.velux', name: 'Velux', myPosition: 'button.velux_my_position' }
    ],
  },
  {
    id: 'tuin',
    name: "Tuin",
    icon: 'sprout',
    entities: [
      {
        // docs/design/lawn-mower
        entity: 'lawn_mower.jeroen_dg2_gmail_com_jaqueline',
        name: 'Jaqueline',
        mower: {
          zone: 'select.jeroen_dg2_gmail_com_jaqueline_zone',
          // Placeholder names: give each zone its own name.
          zones: [
            { option: '1', name: 'Achtertuin' },
            { option: '2', name: 'Voortuin' },
            { option: '3', name: 'Zijtuin' }
          ],
          battery: 'sensor.jeroen_dg2_gmail_com_jaqueline_battery',
          charging: 'binary_sensor.jeroen_dg2_gmail_com_jaqueline_charging',
          rain: 'binary_sensor.jeroen_dg2_gmail_com_jaqueline_rain_sensor',
          online: 'binary_sensor.jeroen_dg2_gmail_com_jaqueline_mqtt',
          error: 'sensor.jeroen_dg2_gmail_com_jaqueline_error',
          bladeHours: 'sensor.jeroen_dg2_gmail_com_jaqueline_blade_runtime_since_reset',
          distance: 'sensor.jeroen_dg2_gmail_com_jaqueline_distance_driven_total'
        }
      }
    ],
  }
];
