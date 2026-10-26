import { Entity } from './entities';

/**
 * The status line on Thuis, e.g. "Iedereen thuis · 3 lichten aan · alles gesloten".
 * Only the entities listed here count; nothing is found automatically. Each
 * entry is `{ entity, name? }`, like a control in a room: `name` replaces HA's
 * name where it's shown ("Jeroen thuis", the rows in "Wat staat aan").
 *
 * - people: person entities. "Iedereen thuis", "Jeroen thuis", "Niemand thuis".
 * - lights: everything that counts as a light that's on (`on`), so a switch
 *   that powers a lamp can be listed too. Also the "Lichten" in "Wat staat aan".
 * - openings: doors, windows, the garage… counted while `on`, `open` or `opening`.
 *   "1 deur of raam open", or "alles gesloten" when none are.
 *
 * Leave a list empty to hide that part.
 */
export interface StatusEntity {
  entity: Entity;
  name?: string;
}

export const STATUS: { people: StatusEntity[]; lights: StatusEntity[]; openings: StatusEntity[] } = {
  people: [
    { entity: Entity.PERSON_JEROEN, name: 'Jeroen' },
    { entity: Entity.PERSON_ELINE, name: 'Eline' }
  ],
  lights: [
    { entity: Entity.LIVING_CUPBOARD_LIGHTS, name: 'CB3' },
    { entity: Entity.CENTRIS_LIGHT, name: 'Centris' },
    { entity: Entity.MARIELOU_HERSTAL_LIGHT, name: 'Herstal' },
    { entity: Entity.GARAGE_STORAGE_LIGHT, name: 'Licht in berging' },
    { entity: Entity.BUREAU_CEILING_LIGHT, name: 'Plafondlamp' }
  ],
  openings: [
    { entity: Entity.BACK_DOOR_CONTACT, name: 'Achterdeur' },
    { entity: Entity.LIVING_FRONT_DOOR_CONTACT, name: 'Voordeur' },
    { entity: Entity.LIVING_SLIDING_WINDOW_CONTACT, name: 'Schuifraam living' },
    { entity: Entity.KITCHEN_SLIDING_WINDOW_CONTACT, name: 'Schuifraam keuken' },
    { entity: Entity.GARAGE_DOOR_STATE, name: 'Garagepoort' }
  ],
};
