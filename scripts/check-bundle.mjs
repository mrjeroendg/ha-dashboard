// Fails the build if anything dev-only (token, websocket auth) leaked into dist/.
import { readFileSync, existsSync } from 'node:fs';
import { loadEnv } from 'vite';

const bundle = readFileSync('dist/ha-dashboard.js', 'utf8');
const env = loadEnv('development', process.cwd(), '');

const forbidden = ['VITE_HA_TOKEN', 'createLongLivedTokenAuth', 'auth/current_user', '[mock]', 'dev-toolbar'];
if (env.VITE_HA_TOKEN && env.VITE_HA_TOKEN.length > 20) forbidden.push(env.VITE_HA_TOKEN);

const leaks = forbidden.filter((s) => bundle.includes(s));
if (leaks.length) {
  console.error('✖ Dev-only code found in dist/ha-dashboard.js:', leaks.map((l) => (l === env.VITE_HA_TOKEN ? '<your token>' : l)));
  process.exit(1);
}
if (/This is the development build of React|react\.development/.test(bundle)) {
  console.error('✖ Bundle contains the React development build.');
  process.exit(1);
}
console.log(`✔ dist/ha-dashboard.js is clean (${(bundle.length / 1024).toFixed(0)} kB, no token/dev code)`);
if (!existsSync('.env.local')) console.log('  (no .env.local found — token check skipped)');
