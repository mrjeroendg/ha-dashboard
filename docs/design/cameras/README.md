# Cameras

Three cameras on **Thuis**: Garage, Achterdeur and Zijpad. Dark mode only. Builds on the [media card](../media-card/README.md) and uses the same sheet, handle, dots and snapping swipe patterns.

| Part | Status |
|---|---|
| Layout, tiles, live sheet, actions, events, placeholder | ✅ **Approved: final. Built** (branch `claude/cameras`), not yet tested against the real cameras. |
| Streaming technique (how live video is delivered) | 🛠️ **Built with HA's own streams** (see [As built](#as-built)). Still open for the go2rtc discussion. |

> ✅ **The design is final.** The owner approved it. Don't change layout, proportions or content without asking first.

![Cameras](./cameras.png)

Source: [`cameras.html`](./cameras.html) (a static mockup; open it in a browser, not part of the build).

---

## As built

As built (dev mode, mock data). Thuis, then the sheet on Garage, Achterdeur and Zijpad:

![Thuis](./built-thuis.png)

![Sheet](./built-sheet.png)

### Config

`src/config/cameras.ts`, in display order (the first camera is the large tile). Cameras missing in HA are left out; with none left, there is no section.

```ts
{
  entity: 'camera.garage',
  name: 'Garage',
  frigate: 'garage',
  actions: [{ label: 'Garagepoort', icon: 'garage', script: 'script.garagepoort' }],
},
```

- `entity`: the HA camera entity. **The IDs in the config are placeholders** (`camera.garage`, `camera.achterdeur`, `camera.zijpad`) until the real ones are known.
- `frigate`: the camera's name in Frigate. With it, "Vandaag" shows Frigate's events; without it, the placeholder.
- `actions`: empty for now. A `script.` is started, an `automation.` is triggered.

### Streaming

Everything goes through Home Assistant, so it works wherever `hass` works (also away from home, with HA's auth):

1. **Tiles:** the camera's `entity_picture`, refreshed every 10 s while Thuis is visible (paused while the sheet is open). The time is when the image loaded.
2. **Live, where the browser plays HLS itself** (iPhone/iPad Companion app, Safari): HA's HLS stream (`camera/stream`) in a native `<video>`, muted, inline. Needs HA's `stream` integration (on by default).
3. **Otherwise, or if HLS fails:** HA's MJPEG stream (`/api/camera_proxy_stream`) in an `<img>`. No extra library needed.
4. **If that fails too:** the still image.

Only the camera in view streams; the others show their still. The time pill on the live image is the current time, ticking every second.

### Frigate events

Via the Frigate integration's websocket command `frigate/events/get` (instance `frigate`, today since midnight, newest first, max 50). Thumbnails come from `/api/frigate/frigate/thumbnail/<id>`, signed with `auth/sign_path` so an `<img>` can load them. Labels in Dutch: Persoon, Auto, Fiets, Motor, Hond, Kat, Vogel, Pakje; anything else as Frigate names it.

- **Quiet day** (Frigate, but nothing yet today): the placeholder with *"Nog niets gebeurd vandaag."* (the suggestion below).
- **Frigate not reachable:** the placeholder with *"Frigate is niet bereikbaar."*

---

## On Thuis

- A **"Camera's"** section below **Snel**. The page scrolls behind the docked mini media player, which stays visible.
- **Fixed layout:**
  - **Garage:** one large tile, 16:9, full width.
  - **Achterdeur and Zijpad:** two small tiles below it, 4:3, side by side. The gap is 10px and the radius 18px.
- The order is **fixed** and never changes based on motion.
- Each tile shows a still image with the **camera name** at the bottom left (white, 14px/600, on a soft bottom gradient) and the **time of the image** at the top right (a small dark pill, 11px, tabular figures).
- **No motion indicators on the tiles:** no labels, no accent border, no "last motion" text.
- Tapping a tile opens the live sheet on that camera.

## Live sheet

- A bottom sheet over the dimmed page, top radius 28px, with a **grab handle** and **3 page dots** under it. Their order is Garage, Achterdeur, Zijpad.
- **Swipe left/right** between cameras with the same snapping as the media card: always a whole camera, never halfway, one per swipe. Close it by swiping down on the handle or tapping the dimmed page.
- Every sheet has the same structure, top to bottom:
  1. **Live image** (16:9, radius 18) with the time at the top right.
  2. **Name** (serif, 24px) with a **"● LIVE"** pill on the right.
  3. **Actions:** 1–2 pill buttons, 42px high, sharing the width equally.
  4. **"Vandaag":** the event list, or the placeholder.
- The sheet height is the same for every camera, so swiping doesn't jump.
- Only the visible camera streams. The stream stops on swipe and when the sheet closes.

### Actions

- Every action **only triggers a Home Assistant script or automation** (fire and forget, like the stream buttons in the media card). All the logic lives in HA.
- Feedback while it runs: a spinner, then ✓, or "Dat lukte niet" on failure.
- Configured per camera, with any number of buttons (1–2 fit best):

  ```ts
  { label: 'Garagepoort', icon: 'garage', script: 'script.garagepoort' }
  ```

- Examples in the mockup:

  | Camera | Actions |
  |---|---|
  | Garage | Garagepoort, Licht garage |
  | Achterdeur | Buitenlicht, Deur op slot |
  | Zijpad | Licht zijpad |

  The final list of scripts is still to be provided.

### "Vandaag"

- **Garage** (in Frigate): today's Frigate events, one per row: a snapshot thumbnail (72×44, radius 10), the label (Persoon / Auto / …), the camera name, and the time on the right.
- **Achterdeur and Zijpad** (not in Frigate): a **placeholder card** in the same spot. It has a crossed-out camera icon, **"Geen opnames"**, and *"{camera} houdt geen gebeurtenissen bij. Live kijken kan wel."*
- When a camera is added to Frigate later, it automatically gets the event list instead of the placeholder.

---

## Streaming: open

To be decided later. The design doesn't depend on it. The options discussed so far:

| Option | Pros | Cons |
|---|---|---|
| HA's `ha-camera-stream` element | WebRTC/HLS chosen automatically | ❌ Rejected: only exists inside the HA frontend, and the dashboard must also work outside HA |
| Native `<video>` + HLS from HA (`camera/stream` via `callWS`) | The device's own player; works wherever `hass` exists, including remotely through HA auth | 1–5 s delay; desktop Chrome needs `hls.js` (dev only) |
| Native `<video>` + go2rtc directly (HLS/MP4/MSE, `frame.jpeg` for tiles) | Fast, low latency, native player | Usually LAN-only with no auth; mixed-content issues with an HTTPS HA; can't be reached away from home |
| Per camera: go2rtc at home, HA as the fallback | The best of both | More configuration |

Questions for that discussion:
- Which go2rtc is in use (Frigate's, an add-on, or HA's built-in)? Are all three cameras in it?
- Is the dashboard used away from home (mobile data), or only on the home network?
- Tiles on Thuis: still images refreshed about every 10 s while Thuis is visible (from `entity_picture` or go2rtc `frame.jpeg`).

## Other open questions

- Final action scripts per camera.
- Garage on a quiet day (Frigate, but no events yet today): reuse the placeholder with *"Nog niets gebeurd vandaag"*?
- Camera entity IDs.
