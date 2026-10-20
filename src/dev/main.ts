// Dev entry, loaded only by index.html (never by the library build).
import '../index';
import type { HaDashboardElement } from '../element';
import { setClockOverride } from '../lib/clock';

if (import.meta.env.DEV) {
  const url = import.meta.env.VITE_HA_URL as string | undefined;
  const token = import.meta.env.VITE_HA_TOKEN as string | undefined;
  const el = document.querySelector('ha-dashboard') as HaDashboardElement;

  // Same config you'd put in the Lovelace YAML.
  el.setConfig({ type: 'custom:ha-dashboard', temperature_entity: 'sensor.woonkamer_temperatuur' });

  if (url && token) {
    const { connectHass } = await import('./haAdapter');
    connectHass(url, token, (hass) => {
      el.hass = hass;
    }).catch((err) => console.error('Kon niet verbinden met Home Assistant', err));
    mountToolbar(null);
  } else {
    console.info('[dev] No VITE_HA_TOKEN in .env.local — using mock data.');
    const { createMockHass, SCENARIOS } = await import('./mockHass');
    const mock = createMockHass((hass) => {
      el.hass = hass;
    });
    mountToolbar({ scenarios: SCENARIOS, load: mock.loadScenario });
  }
}

interface MockControls {
  scenarios: Record<string, { label: string; at: string }>;
  load: (key: string | null) => void;
}

/**
 * Small bar under the phone frame to preview moments of the day. With mock
 * data it also loads matching fake states; with real HA it only shifts the clock.
 */
function mountToolbar(mock: MockControls | null) {
  const presets: Array<{ key: string | null; label: string; at: string | null }> = [
    { key: null, label: 'Nu', at: null },
    ...Object.entries(
      mock?.scenarios ?? {
        ochtend: { label: 'Di 07:15', at: '2026-10-20T07:15' },
        weekend: { label: 'Za 10:00', at: '2026-10-24T10:00' },
        avond: { label: 'Di 19:30', at: '2026-10-20T19:30' },
        nacht: { label: 'Di 23:10', at: '2026-10-20T23:10' },
      },
    ).map(([key, s]) => ({ key, label: s.label, at: s.at })),
  ];

  const bar = document.createElement('div');
  bar.id = 'dev-toolbar';
  bar.innerHTML = `<span>${mock ? 'Mock' : 'Live'}</span>`;

  const select = (preset: (typeof presets)[number], button: HTMLButtonElement) => {
    setClockOverride(preset.at ? new Date(preset.at) : null);
    mock?.load(preset.key);
    bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === button));
    const params = new URLSearchParams(location.search);
    if (preset.key) params.set('moment', preset.key);
    else params.delete('moment');
    history.replaceState(null, '', `?${params}`);
  };

  const initial = new URLSearchParams(location.search).get('moment');
  for (const preset of presets) {
    const button = document.createElement('button');
    button.textContent = preset.label;
    button.onclick = () => select(preset, button);
    bar.append(button);
    if (preset.key === initial) queueMicrotask(() => select(preset, button));
  }
  if (!initial || !presets.some((p) => p.key === initial)) {
    queueMicrotask(() => select(presets[0], bar.querySelector('button')!));
  }

  document.body.append(bar);
}
