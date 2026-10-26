import { Entity } from './entities';

/**
 * The status line on Thuis, e.g. "Iedereen thuis · 3 lichten aan · 21,5° binnen".
 * Only the entities listed here count; nothing is found automatically.
 *
 * - people: person entities. "Iedereen thuis", "Jeroen thuis", "Niemand thuis".
 * - lights: everything that counts as a light that's on (`on`), so a switch
 *   that powers a lamp can be listed too.
 * - openings: doors, windows, the garage… counted while `on`, `open` or `opening`.
 *   "1 deur of raam open", or "alles gesloten" when none are.
 * - temperature: the indoor temperature sensor.
 *
 * Leave a list empty (or the temperature out) to hide that part.
 */
export const STATUS = {
  people: [Entity.PERSON_JEROEN, Entity.PERSON_ELINE] as Entity[],
  lights: [Entity.LIVING_CUPBOARD_LIGHTS, Entity.CENTRIS_LIGHT] as Entity[],
  openings: [
    Entity.BACK_DOOR_CONTACT,
    Entity.LIVING_FRONT_DOOR_CONTACT,
    Entity.LIVING_SLIDING_WINDOW_CONTACT,
    Entity.KITCHEN_SLIDING_WINDOW_CONTACT,
    Entity.GARAGE_DOOR_STATE
  ] as Entity[],
  temperature: undefined as Entity | undefined,
};
