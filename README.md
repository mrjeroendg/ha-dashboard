# ha-dashboard

A fully custom Home Assistant dashboard in React. It builds into one ES module, `ha-dashboard.js`, which defines the custom element `<ha-dashboard>`. HA loads it as a card inside a **Panel view**, so it fills the whole screen in the Companion app on the iPhone.

**POC scope:** the header only. It shows a greeting, the date and a short status line for the house.

```
src/
├── index.ts            Library entry: registers <ha-dashboard> (+ HA card picker entry)
├── element.tsx         Custom element: receives `hass` + config from HA, renders React in shadow DOM
├── App.tsx             Dashboard layout
├── components/Header.tsx
├── lib/greeting.ts     Time-of-day greeting + Dutch date (all logic in React, not HA templates)
├── lib/houseStatus.ts  "Iedereen thuis · 3 lichten aan · 21,5° binnen"
├── config/shortcuts.ts YOUR shortcuts on Thuis ("Snel"), in order (edit this)
├── config/attention.ts YOUR warnings on Thuis, under the status line (edit this)
├── components/Attention.tsx  Warning banners (docs/design/attention-banner)
├── components/media/            Media card (docs/design/media-card)
│   ├── MiniPlayer.tsx           Small: Chromecast + Sonos pages, swipe, opens the large one
│   ├── CastPage.tsx / SonosPage.tsx           Small pages
│   ├── ExpandedPlayer.tsx       Large: handle, dots, swipe down to close
│   ├── CastExpanded.tsx / SonosExpanded.tsx   Large pages
│   └── parts/                   Shared: progress bar, LIVE pill, volume slider, rows of the large card
├── hooks/useMediaPlayer.ts      Shared data + actions for one media_player (small and large use it)
├── components/QuickActions.tsx  "Snel" grid with your shortcuts
├── components/BottomNav.tsx     Floating room navigation ("Thuis" + your rooms)
├── components/RoomView.tsx      Room page: rows with switches, buttons, read-only sensors
├── components/BrightnessSlider.tsx  Slider for dimmable lights
├── components/ColorPicker.tsx       Swatches + custom color for color lights
├── lib/moreInfo.ts     Opens HA's own more-info dialog for an entity
├── config/rooms.ts     YOUR rooms: name, icon, which entities (edit this)
├── config/media.ts     Sonos entity + stream scripts for the mini player (edit this)
├── config/ignore.ts    Entities never counted automatically (e.g. an access point's LED "light")
├── lib/rooms.ts        How each entity type is shown and what tapping it does
├── hooks/useNow.ts     Ticks every minute, refreshes when the app returns to foreground
├── styles.css          Warm neutrals, dark mode only
└── dev/                DEV ONLY — never imported by the library build
    ├── main.ts         Dev entry used by index.html
    ├── haAdapter.ts    home-assistant-js-websocket → `hass`-shaped object
    └── mockHass.ts     Fake `hass` with sample entities when there's no token
scripts/
├── check-bundle.mjs    Fails the build if token/dev code ends up in dist/
└── deploy.mjs          Copies the bundle to /config/www and bumps ?v=N
```

## How dev and production stay separate

| | Dev (`npm run dev`) | Production (`ha-dashboard.js`) |
|---|---|---|
| Entry | `index.html` → `src/dev/main.ts` | `src/index.ts` |
| `hass` comes from | `haAdapter.ts` over a websocket with your long-lived token | HA itself, which sets `element.hass` |
| Token | `.env.local` (gitignored) | not present |

The library build only follows imports from `src/index.ts`, and nothing there imports `src/dev/`. The dev code is also wrapped in `if (import.meta.env.DEV)`. After every build, `scripts/check-bundle.mjs` searches the bundle for the token value and for the websocket-auth code. If it finds either, the build fails.

---

## Setup on Windows

You need **Node.js 22 or newer** from https://nodejs.org (the LTS installer). Run the commands below in **PowerShell**, inside the project folder.

```powershell
node -v
```
Prints your Node version. It should be `v22.x` or higher.

```powershell
git clone https://github.com/mrjeroendg/ha-dashboard.git
cd ha-dashboard
```
Downloads the repo and moves into its folder.

```powershell
npm install
```
Installs React, Vite, TypeScript and the HA websocket library into `node_modules\`. You only do this once, or again after `package.json` changes.

```powershell
copy .env.example .env.local
notepad .env.local
```
Creates your private settings file from the template and opens it. Fill in:

- `VITE_HA_URL=http://192.168.1.100:8123`
- `VITE_HA_TOKEN=…` In HA, open your **profile → Security → Long-lived access tokens → Create token**. Use an **admin** user's token, because the deploy script edits dashboard resources.
- `HA_WWW_PATH=\\192.168.1.100\config\www` This is the **Samba share** add-on path (see below).

`.env.local` is gitignored, so it never gets committed.

## Dev mode (hot reload)

```powershell
npm run dev
```
Starts the Vite dev server at http://localhost:5173. The page connects to your HA with the token and shows live states. When you save a `.tsx` or `.css` file, the browser updates straight away. Stop the server with `Ctrl+C`.

**Without a token** (empty or missing `VITE_HA_TOKEN`), dev mode uses **mock data** from `src/dev/mockHass.ts`. The fake states start out matching the current moment of the day; reload the page to reset them. Tapping a card changes the fake states, and the console logs the service call it would make. The mock code is dev-only and never ends up in the bundle.

```powershell
npm run dev:lan
```
Does the same, but also makes the server reachable on your network. Open `http://<your-PC-IP>:5173` in Safari on the iPhone to see the real device while you code. If the iPhone can't reach it, allow Node.js through the Windows Firewall when Windows asks.

## Build and deploy to HA

### One-time HA preparation

1. **Samba share add-on:** In HA, go to **Settings → Add-ons → Add-on store → Samba share**. Install it, set a username and password, and start it. In Windows Explorer, open `\\192.168.1.100\config` and sign in once. Create a folder named `www` if it doesn't exist yet. If you just created `www`, restart HA once so `/local/` is served.
2. **Advanced mode:** Open your HA profile and turn on **Advanced mode**. Without it, the Resources page from step 5 doesn't show up.

### Every deploy

```powershell
npm run deploy
```
This does three things:
1. `tsc -b` typechecks the code.
2. `vite build` creates `dist\ha-dashboard.js` and checks it for leaked secrets.
3. `scripts/deploy.mjs` copies the file to `\\192.168.1.100\config\www\` and updates the dashboard resource in HA to `/local/ha-dashboard.js?v=N+1`. On the first run it creates that resource. The `?v=` number changes on every deploy, so the iPhone downloads the new file instead of reusing a cached one.

```powershell
npm run build
```
Only builds into `dist\`, without copying anything. Use this if you'd rather copy the file yourself.

<details>
<summary>Deploying without the script</summary>

Copy `dist\ha-dashboard.js` to `\\192.168.1.100\config\www\`. Then go to **Settings → Dashboards → ⋮ → Resources → Add resource**, enter URL `/local/ha-dashboard.js?v=1` and choose type **JavaScript module**. Increase `v` on every deploy.
</details>

### Create the dashboard (once)

1. Go to **Settings → Dashboards → Add dashboard → New dashboard from scratch**. Name it "Thuis" and open it.
2. Click **✏️ (edit) → ⋮ → Raw configuration editor** and paste:

   ```yaml
   views:
     - title: Thuis
       path: thuis
       type: panel
       cards:
         - type: custom:ha-dashboard
           # optional:
           # name: Jeroen                                   # otherwise: your HA user name
           # temperature_entity: sensor.woonkamer_temperature
   ```
3. Save.

### Show it on the iPhone

1. In the Companion app, open the sidebar and tap the new **Thuis** dashboard. You should see the header.
2. To make it the default **on this device**, tap your **profile** (bottom of the sidebar) and set **Dashboard** to "Thuis". This setting is stored per device, so other devices keep their own default.
3. If you still see an old version after a deploy, pull down to refresh. If that doesn't help, go to **Companion App settings → Debugging → Reset frontend cache**.

## Shortcuts (Snel)

`src/config/shortcuts.ts` lists the shortcuts on Thuis. They show in that order, always, with no time or state logic:

```ts
{ label: 'Film kijken', icon: 'tv', entity: 'script.film_kijken', detail: 'Dimmen & tv aan' },
{ label: 'Keuken', icon: 'bulb', entity: 'light.keuken', service: 'toggle' },
```

A tap calls `<domain>.<service>` on the entity (default `turn_on`), and shows "Dat lukte niet" only if the call fails. A card whose entity is `on` is highlighted. An empty list shows no "Snel" section.

## Warnings

`src/config/attention.ts` lists what deserves a warning on Thuis. Each warning is a banner under the status line, and you can't close it: it disappears once the cause is gone.

```ts
{ entity: 'cover.garagepoort', level: 'high', title: 'Garagepoort staat open', icon: 'garage' },
{ entity: 'update.*', level: 'low' },
```

- **level:** `high` (dark red: safety or damage), `medium` (red: needs attention today), `low` (orange: maintenance, such as updates). The highest level is at the top; within a level the newest is first.
- **when:** the states that trigger it. Default: `open`/`opening` for a cover, `unlocked`/`open` for a lock, otherwise `on` (an `update.*` entity is `on` when there's a new version).
- A warning shows as soon as the state matches. For a state, the second line shows how long it has lasted: "Al 25 min · 22:04".
- A banner has no buttons: it only tells you something needs attention.
- `entity` accepts `*` wildcards. Entities in `src/config/ignore.ts` are skipped.

## Sonos mini player

On Thuis, docked above the room navigation (built from the approved design in `docs/design/media-card/`):

- Set your Sonos entity in `SONOS` in `src/config/media.ts`, and list your stream scripts in `STREAM_SCRIPTS`. Each button is labelled with the script's name in HA, and scripts that don't exist are hidden.
- **Nothing playing:** "Muziek op Sonos" plus the stream buttons. **Playing or paused:** cover, station or title, current track, and a play/pause button.
- **Tapping a stream button** runs `script.turn_on`. The button shows a spinner until the Sonos plays something new, and "Dat lukte niet" if that doesn't happen within 10 s.
- The active stream is not highlighted, on purpose.
- **Chromecast** (`CHROMECAST` in the same file): a second page next to Sonos, always present. You swipe between the pages, and a swipe always lands on a whole page. It shows the thumbnail (or a colour fade), the title, play/pause and a progress bar that moves smoothly by itself, or "LIVE" for live TV. When the TV is idle it says "Niets aan het casten". The order is fixed: Chromecast first, then Sonos.
- **Tapping the top row** of a page opens the **expanded player** on that device (483 px). It has a large image, title, progress bar or LIVE pill, previous/play/next (Sonos) or −10/play/+30 s (Chromecast), a volume slider, and Stop for the Chromecast. Swipe sideways to switch device. Swipe the handle down, or tap the dimmed page, to close.

## Rooms

The bottom navigation shows **Thuis** plus the rooms in `src/config/rooms.ts`, in that order. You define them yourself; HA areas aren't used. Each room lists its entities:

- **Controllable** (light, switch, fan, input_boolean, cover, media_player): a row with a switch.
- **Dimmable lights** (`supported_color_modes` contains anything other than `onoff`): also a brightness slider while the light is on. The value is sent to HA 300 ms after you stop dragging (one `light.turn_on` with `brightness_pct`), not on every movement.
- **Color lights** (`hs`, `xy`, `rgb`, `rgbw`, `rgbww` in `supported_color_modes`): color swatches under the slider, plus a rainbow swatch that opens **HA's own light dialog** (color wheel, temperature, brightness) via the `hass-more-info` event. In `npm run dev` there is no HA frontend to open that dialog, so there the rainbow swatch uses the browser's native color picker instead. Lights with `color_temp` also get warm, neutral and cool white. The light's icon takes its current color.
- **Climate:** −/+ buttons that change the target temperature by 0.5°.
- **Scene/script:** a "Start" button.
- **Lock:** shows "Op slot", or a button to lock it. Unlocking from the dashboard is intentionally not possible.
- **Everything else** (sensor, binary_sensor, …): read-only. A room with only sensors is fine.

Entities that don't exist in HA are skipped, and a room with none left is hidden. Use `{ entity, name }` for a shorter row name.

## Status line logic

Entities in `src/config/ignore.ts` are skipped in all of these. Use exact IDs or `*` wildcards.


`src/lib/houseStatus.ts` builds the status line from these parts:

- **Presence:** `person.*` entities. Possible results are "Iedereen thuis", "Je bent thuis", "Jeroen thuis" and "Niemand thuis".
- **Lights:** the number of `light.*` entities that are `on`.
- **Doors and windows:** `binary_sensor.*` entities with device class door, window, garage_door or opening that are `on`. This part is only shown when something is open.
- **Temperature:** only shown when `temperature_entity` is set in the card config.
