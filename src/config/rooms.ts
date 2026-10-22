import type { IconName } from '../components/Icon';
import type { Shortcut } from './shortcuts';

export interface RoomEntity {
  entity: string;
  name?: string;
  allowUnknownState?: boolean;
  myPosition?: string;
  simple?: boolean;
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
  openings?: Array<string | RoomEntity>;
}

export type RoomConfig =
  | (RoomBase & { entities: Array<string | RoomEntity>; sections?: never })
  | (RoomBase & { sections: RoomSection[]; entities?: never });

export const ROOMS: RoomConfig[] = [
  {
    id: 'living',
    name: 'Living',
    icon: 'sofa',
    openings: ['binary_sensor.0x001788011004451e_contact', 'binary_sensor.0x00178801100445ff_contact'],
    sections: [
      {
        title: "Verlichting",
        entities: [
          { entity: 'light.living_switch_dining_table', name: 'Staanlamp' },
          { entity: 'light.huecupboard', name: 'CB3' }
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
    id: 'marielou',
    name: "Marielou",
    icon: 'baby',
    temperature: 'sensor.0xf044d3fffecd20d8_temperature',
    humidity: 'sensor.0xf044d3fffecd20d8_humidity',
    entities: [
      { entity: 'light.bedroom_marielou_herstal_light_switch', name: 'Herstal' },  
      { entity: 'cover.rts_16767817', name: 'Rolluik', myPosition: 'button.rts_16767817_my_position' }
    ],
  },
  {
    id: 'bureau',
    name: "Bureau",
    icon: 'monitor',
    temperature: 'sensor.0x7c3e822f69dd0000_temperature',
    humidity: 'sensor.0x7c3e822f69dd0000_humidity',
    entities: [
      { entity: 'light.ceiling_light', name: 'Verlichting', simple: true },  
      { entity: 'cover.rts_16765494', name: 'Rolluik', myPosition: 'button.rts_16765494_my_position' }
    ],
  }
];
