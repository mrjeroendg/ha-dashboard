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
  people: ['person.jeroen', 'person.eline'] as string[],
  lights: ['light.huecupboard', 'light.centris'],
  openings: [
    'binary_sensor.0x0017880110044edb_contact', // back door
    'binary_sensor.0x001788011004451e_contact', // front door
    'binary_sensor.0x001788011004452e_contact', // sliding window living
    'binary_sensor.0x00178801100445ff_contact', // sliding window kitchen,
    'sensor.garage_door_state_classification'
  ],
  temperature: undefined as string | undefined,
};
