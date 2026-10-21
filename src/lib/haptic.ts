export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'failure';

/**
 * Haptic feedback via the Home Assistant Companion app. HA's frontend listens
 * for a `haptic` event on window and forwards it to the app, which plays it on
 * the iPhone's Taptic Engine. Outside the app (browser, npm run dev) nothing
 * picks it up, so it simply does nothing.
 */
export function haptic(type: HapticType = 'selection') {
  window.dispatchEvent(new CustomEvent('haptic', { detail: type, bubbles: true, composed: true }));
}
