import { HaDashboardElement } from './element';

const TAG = 'ha-dashboard';

if (!customElements.get(TAG)) {
  customElements.define(TAG, HaDashboardElement);
}

// Makes the card show up in HA's "Add card" picker.
const w = window as unknown as { customCards?: Array<Record<string, unknown>> };
w.customCards = w.customCards ?? [];
if (!w.customCards.some((c) => c.type === TAG)) {
  w.customCards.push({
    type: TAG,
    name: 'HA Dashboard (React)',
    description: 'Volledig custom dashboard in React.',
  });
}
