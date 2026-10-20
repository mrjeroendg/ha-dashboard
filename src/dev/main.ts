// Dev entry, loaded only by index.html (never by the library build).
import '../index';
import type { HaDashboardElement } from '../element';

if (import.meta.env.DEV) {
  const url = import.meta.env.VITE_HA_URL as string | undefined;
  const token = import.meta.env.VITE_HA_TOKEN as string | undefined;
  const el = document.querySelector('ha-dashboard') as HaDashboardElement;

  // Same config you'd put in the Lovelace YAML.
  el.setConfig({ type: 'custom:ha-dashboard' });

  if (!url || !token) {
    console.error('Set VITE_HA_URL and VITE_HA_TOKEN in .env.local (see .env.example).');
  } else {
    const { connectHass } = await import('./haAdapter');
    connectHass(url, token, (hass) => {
      el.hass = hass;
    }).catch((err) => console.error('Kon niet verbinden met Home Assistant', err));
  }
}
