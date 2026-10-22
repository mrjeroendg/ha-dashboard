/**
 * The status line on Thuis, e.g. "Iedereen thuis · 3 lichten aan · 21,5° binnen".
 * Only the entities listed here count; nothing is found automatically.
 *
 * - people: person entities. "Iedereen thuis", "Jeroen thuis", "Niemand thuis".
 * - lights: everything that counts as a light that's on (`on`), so a switch
 *   that powers a lamp can be listed too.
 * - openings: doors, windows, the garage… counted while `on`, `open` or `opening`.
 * - temperature: the indoor temperature sensor.
 *
 * Leave a list empty (or the temperature out) to hide that part.
 */
export const STATUS = {
  people: [] as string[],
  lights: ['switch.0x94a081fffe4fce2f', 'light.huecupboard', 'light.centris'],
  openings: ['sensor.garage_door_state_classification'],
  temperature: undefined as string | undefined,
};
