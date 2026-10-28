import type { IconName } from '../components/Icon';
import { Entity } from './entities';

/**
 * The status band on Thuis (docs/design/now-ticker), e.g. "Iedereen thuis ·
 * 3 lichten aan · alles gesloten · Cara is aan het drinken", scrolling by.
 * Only the entities listed here count; nothing is found automatically. Each
 * entry is `{ entity, name? }`, like a control in a room: `name` replaces HA's
 * name where it's shown ("Jeroen thuis", the rows in "Nu").
 *
 * - people: person entities. "Iedereen thuis", "Jeroen thuis", "Niemand thuis".
 * - lights: everything that counts as a light that's on (`on`), so a switch
 *   that powers a lamp can be listed too. Also the "Lichten" in "Nu".
 * - aircos: climate entities, on in any mode but `off`. "2 airco's aan"; left
 *   out of the band when none are on. Also the "Airco's" in "Nu".
 * - openings: doors, windows, the garage… counted while `on`, `open` or `opening`.
 *   "1 deur of raam open", or "alles gesloten" when none are.
 *
 * Leave a list empty to hide that part.
 */
export interface StatusEntity {
  entity: Entity;
  name?: string;
}

export const STATUS: { people: StatusEntity[]; lights: StatusEntity[]; aircos: StatusEntity[]; openings: StatusEntity[] } = {
  people: [
    { entity: Entity.PERSON_JEROEN, name: 'Jeroen' },
    { entity: Entity.PERSON_ELINE, name: 'Eline' }
  ],
  lights: [
    { entity: Entity.LIVING_CUPBOARD_LIGHTS, name: 'CB3' },
    { entity: Entity.CENTRIS_LIGHT, name: 'Centris' },
    { entity: Entity.MARIELOU_HERSTAL_LIGHT, name: 'Herstal' },
    { entity: Entity.GARAGE_STORAGE_LIGHT, name: 'Berging' },
    { entity: Entity.BUREAU_CEILING_LIGHT, name: 'Plafondlamp' }
  ],
  aircos: [
    { entity: Entity.MASTER_BEDROOM_AIRCO, name: 'Slaapkamer' },
    { entity: Entity.MARIELOU_AIRCO, name: 'Marielou' },
    { entity: Entity.GUEST_ROOM_AIRCO, name: 'Gasten' }
  ],
  openings: [
    { entity: Entity.BACK_DOOR_CONTACT, name: 'Achterdeur' },
    { entity: Entity.LIVING_FRONT_DOOR_CONTACT, name: 'Voordeur' },
    { entity: Entity.LIVING_SLIDING_WINDOW_CONTACT, name: 'Schuifraam living' },
    { entity: Entity.KITCHEN_SLIDING_WINDOW_CONTACT, name: 'Schuifraam keuken' },
    { entity: Entity.GARAGE_DOOR_STATE, name: 'Garagepoort' }
  ],
};

/**
 * Something happening right now, at the end of the status band while its
 * entity is `on` (docs/design/now-ticker): "Cara is aan het drinken". `name`
 * is in white, `text` in grey, after the icon in `color`.
 */
export interface NowEntity {
  entity: Entity;
  icon: IconName;
  color: string;
  name: string;
  text: string;
}

export const NOW: NowEntity[] = [
  { entity: Entity.CARA_WATER_FOUNTAIN, icon: 'cat', color: '#6cb8e6', name: 'Cara', text: 'is aan het drinken' },
];

/**
 * Today's birthdays (docs/design/now-ticker), right after who's home in the
 * band: "Jan is jarig", or "2 jarigen vandaag". An HA automation fills the
 * todo list each night with one item per birthday, the name as its title.
 */
export const BIRTHDAYS = {
  todoList: Entity.BIRTHDAYS_TODAY_LIST,
  icon: 'cake' as IconName,
  color: '#ec8fb5',
};
