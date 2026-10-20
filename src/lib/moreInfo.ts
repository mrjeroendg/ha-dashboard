/**
 * Ask Home Assistant to open its own more-info dialog for an entity (for a
 * light: color wheel, temperature and brightness). `composed` lets the event
 * cross our shadow DOM boundary so HA's frontend receives it.
 *
 * Only works inside HA; in `npm run dev` nothing listens for the event.
 */
export function openMoreInfo(from: EventTarget, entityId: string) {
  from.dispatchEvent(
    new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }),
  );
}
