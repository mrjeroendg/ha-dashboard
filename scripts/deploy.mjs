// Copies dist/ha-dashboard.js to HA's /config/www and bumps the ?v=N cache
// buster on the Lovelace resource, so the Companion app fetches the new file.
// Settings come from .env.local (see .env.example). Needs Node 22+ (built-in WebSocket).
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), '');
const { HA_WWW_PATH, VITE_HA_URL, VITE_HA_TOKEN } = env;
const FILE = 'ha-dashboard.js';
const BASE_URL = `/local/${FILE}`;

// 1. Copy the bundle
if (!HA_WWW_PATH) {
  console.error('✖ Set HA_WWW_PATH in .env.local, e.g. HA_WWW_PATH=\\\\192.168.1.100\\config\\www');
  process.exit(1);
}
if (!existsSync(HA_WWW_PATH)) {
  console.error(`✖ ${HA_WWW_PATH} is not reachable. Is the Samba share add-on running and does /config/www exist?`);
  process.exit(1);
}
copyFileSync(join('dist', FILE), join(HA_WWW_PATH, FILE));
console.log(`✔ Copied dist/${FILE} → ${join(HA_WWW_PATH, FILE)}`);

// 2. Bump the resource version over HA's websocket API
if (!VITE_HA_URL || !VITE_HA_TOKEN) {
  console.log(`ℹ No HA URL/token in .env.local — bump the resource manually to ${BASE_URL}?v=<next number>`);
  process.exit(0);
}

const ws = new WebSocket(VITE_HA_URL.replace(/^http/, 'ws') + '/api/websocket');
let nextId = 1;
const pending = new Map();
const send = (msg) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, ...msg }));
  });

ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.type === 'auth_required') return ws.send(JSON.stringify({ type: 'auth', access_token: VITE_HA_TOKEN }));
  if (msg.type === 'auth_invalid') return fail(new Error('Token rejected by Home Assistant'));
  if (msg.type === 'auth_ok') return bumpResource().catch(fail);
  if (msg.type === 'result' && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.success ? resolve(msg.result) : reject(new Error(msg.error?.message ?? 'HA error'));
  }
};
ws.onerror = () => fail(new Error(`Could not connect to ${VITE_HA_URL}`));

async function bumpResource() {
  const resources = await send({ type: 'lovelace/resources' });
  const existing = resources.find((r) => r.url.split('?')[0] === BASE_URL);
  const current = existing ? Number(new URL(existing.url, 'http://x').searchParams.get('v')) || 0 : 0;
  const url = `${BASE_URL}?v=${current + 1}`;

  if (existing) {
    await send({ type: 'lovelace/resources/update', resource_id: existing.id, res_type: 'module', url });
  } else {
    await send({ type: 'lovelace/resources/create', res_type: 'module', url });
  }
  console.log(`✔ Lovelace resource ${existing ? 'updated' : 'created'}: ${url}`);
  console.log('  On the iPhone: pull down to refresh, or Companion App settings → Debugging → Reset frontend cache.');
  ws.close();
}

function fail(err) {
  console.error(`✖ ${err.message}`);
  console.error(`  The copy succeeded; set the resource URL manually to ${BASE_URL}?v=<next number>`);
  ws.close();
  process.exit(1);
}
