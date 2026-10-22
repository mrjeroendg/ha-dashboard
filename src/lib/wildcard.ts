/** An entity pattern as a RegExp: exact IDs, or `*` as a wildcard ('update.*'). */
export function wildcard(pattern: string): RegExp {
  return new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
}
