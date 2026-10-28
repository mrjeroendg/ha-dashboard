# Cameras: target code structure

> ✅ **Approved and built** (28 October).

The goal: the bare minimum, written so you can read in the code **what happens when**. The camera behaves the same as now for everything that stays.

## What the camera does after the refactor

1. **On Thuis:** the tiles, still images refreshed every 10 s (unchanged).
2. **Tap a tile:** the shared `BottomSheet` opens, one page per camera, swiped sideways (page dots only with more than one camera).
3. **Each page:** the live image (with the still image underneath until the video plays), the camera's name, and one status line.
4. **The stream** is tried in this order, and the first one that shows a picture wins:

   | Step | Time limit | Only when |
   |---|---|---|
   | WebRTC, attempt 1, 2, 3 (1 s pause between attempts) | 5 s per attempt | HA offers it, and there's a websocket |
   | HLS | 15 s | HA offers it, and the browser plays it itself (iOS, Safari) |
   | MJPEG | 8 s | always |
   | Still image | n/a | when nothing worked |

   A step fails when it reports an error, or when its time limit runs out without a picture. Then the next step starts.
5. **The status line:** "Verbinden…" until there's a picture, then "WebRTC · relay" (or "· lokaal", "· direct"), "HLS" or "MJPEG". "Stilstaand beeld" when nothing worked.
6. **A stream that drops after it played** (WebRTC connection lost, video or image error) starts again from the top: WebRTC attempt 1.
7. **Only the camera in view streams.** Swiping away or closing the sheet stops it.

## What goes

- **Frigate:** the "Vandaag" events, the thumbnails, the labels, the mock data.
- **"Vandaag" and "Geen opnames":** the section, the placeholder and the `cameraOff` icon.
- **The actions:** the buttons, `runCameraAction`, the `CameraAction` type, their CSS.
- **The "LIVE" pill** next to the name.
- **Dimming the image** while connecting.
- **The detailed status line:** the attempt counter, the countdown bar, the device name (`platformName`), the time to the first frame.
- **The sheet's own copy** of the handle, the dragging and the backdrop (now `BottomSheet`).
- **`hassRef` and `entityRef`:** each step reads `hass` when it starts, which is fresh enough (a step lasts at most 15 s).
- **The `waiter` construction:** the promise that the image resolved from outside. See below.

## The files

| File | What's in it |
|---|---|
| `src/config/cameras.ts` | `Camera`: `entity` (an `Entity`) and `name`. `CAMERAS`: only the Achterdeur for now. |
| `src/lib/cameras.ts` | Small helpers, each one thing: `configuredCameras(states)`, `stillImageUrl(...)`, `mjpegUrl(...)`, `hlsUrl(...)`, `canPlayHls()`. |
| `src/lib/webrtc.ts` | `connectWebRtc(hass, entityId, signal)`: one WebRTC attempt through HA. Same protocol as now, but split into named steps (see below). Plus `routeOf(...)`. |
| `src/hooks/useCameraStream.ts` | Which step it's on, and moving to the next one. The heart of it, see below. |
| `src/components/cameras/Cameras.tsx` | The tiles on Thuis (as now, with descriptive names). |
| `src/components/cameras/CameraSheet.tsx` | `BottomSheet` + the pages + the dots. |
| `src/components/cameras/CameraPage.tsx` | One page: `LiveImage`, the name, the status line. |
| `src/components/cameras/LiveImage.tsx` | Shows the source of the current step (`<video>` or `<img>`) over the still image, and reports "playing" or "error". |
| `src/styles.css` | The camera section, without the CSS of everything that goes. |

`StreamStatus.tsx` goes: the status line is one line in `CameraPage`.

## The heart: `useCameraStream`, as a list of steps

Now, one 100-line effect runs all phases in a row, with nested functions and a promise that the image resolves from outside. The new version is a **simple state machine**: the hook only remembers **which step it's on**, and React does the rest.

```ts
type StreamStep =
  | { kind: 'webrtc'; attempt: 1 | 2 | 3 }
  | { kind: 'hls' }
  | { kind: 'mjpeg' }
  | { kind: 'still' };
```

Three small effects, each doing one thing:

1. **Which steps are possible** (once, when the camera comes into view): ask HA (`camera/capabilities`), and make the list, e.g. `webrtc 1 → webrtc 2 → webrtc 3 → hls → mjpeg → still`.
2. **Start the current step:** get its source (the WebRTC connection, the HLS link, the MJPEG link) and hand it to `LiveImage`. On an error: the next step. When the step changes, or the camera leaves view, the previous one is stopped (an `AbortController`, and the WebRTC connection closed).
3. **The time limit of the current step:** a timer that moves on to the next step, **unless the picture plays**. When it plays, the timer is cleared.

And two things `LiveImage` reports back, as plain callbacks:

- **`onPlaying`:** there's a picture. The status line shows what's playing.
- **`onError`:** before it played, the next step; after it played, start again from the top.

Moving on is one function, `goToNextStep()`, which takes the next item from the list. That's the only place where the order lives.

So reading top to bottom: *which steps are there → start this step → give it this long → on a picture, stop the clock → on a failure, next step*.

### WebRTC, split into named steps

`connectWebRtc` keeps the protocol HA's own player uses (it has to), but each part gets a name instead of one long promise:

1. `getClientConfig`: the ICE servers from HA, including Nabu Casa's relay.
2. `createReceivingConnection`: a connection that only receives video and audio.
3. `sendOffer`: the offer over HA's websocket, and handling HA's answers (session, answer, candidates, error), each in its own small function.
4. Ready when there's video **and** the connection is `connected`.

And one addition, for the review finding: the connection reports when it **drops later** (`failed` or `disconnected`), so the hook can start again from the top.

## The review findings

| Finding | How it's solved |
|---|---|
| A dropped WebRTC connection keeps showing "Live" | The connection reports the drop; the hook starts again from WebRTC attempt 1. |
| WebRTC retries too often | Exactly 3 attempts, each at most 5 s, 1 s between them. |
| MJPEG's `onLoad` doesn't always fire | `LiveImage` checks for the MJPEG image's size (`naturalWidth > 0`) instead of trusting `onLoad`. |
| No fallback when HLS or MJPEG fails after it started | `onError` after playing starts again from the top. |

## Naming

Following `CLAUDE.md`: descriptive names everywhere (`peerConnection` instead of `pc`, `streamStep` instead of `s`, `cameraEntity` instead of `e`), booleans as a question (`isPlaying`, `isInView`), and callbacks with a block body when they do more than one thing.

## Testing

- **In dev mode:** the tiles, opening and closing the sheet, and the order of the steps. The mock's websocket never answers a WebRTC offer, so it goes through WebRTC 1 → 2 → 3 (at about 0, 6 and 12 s) → MJPEG (about 17 s), and MJPEG "plays" the still image. Also tested: HLS failing straight away goes to MJPEG; an error after it played starts again at WebRTC 1; no access token ends on the still image.
- **On your devices (needed):** open the Achterdeur on the iPhone, at home and on mobile data, and check the status line: "WebRTC · lokaal" at home, "WebRTC · relay" away. If it ends on something else, the line shows on which.

## The design README

`docs/design/cameras/README.md` is updated along with it: the removed parts (pill, "Vandaag", actions, the detailed status line) and the new rules (3 WebRTC attempts, starting again after a drop).
