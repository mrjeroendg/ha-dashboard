# Cameras

Three cameras on **Thuis**: Garage, Achterdeur and Zijpad. Dark mode only. Builds on the [media card](../media-card/README.md) and uses the same sheet, handle, dots and snapping swipe patterns.

| Part | Status |
|---|---|
| Layout, tiles, live sheet, actions, events, placeholder | ✅ **Approved: final.** Build exactly as designed. |
| Streaming technique (how live video is delivered) | 🗣️ **Open, to be discussed later.** See [Streaming](#streaming--open). |

> ✅ **The design is final.** The owner approved it. Don't change layout, proportions or content without asking first.

![Cameras](./cameras.png)

Source: [`cameras.html`](./cameras.html) (a static mockup; open it in a browser, not part of the build).

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
