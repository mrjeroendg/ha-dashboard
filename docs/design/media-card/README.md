# Media card

One card on **Thuis** for all media: Sonos and Chromecast, plus stream buttons that start Home Assistant scripts. Dark mode only. It replaces the earlier full-screen Sonos design in [`../sonos-player/`](../sonos-player/README.md).

| Part | Status |
|---|---|
| [Mini player](#mini-player--approved-final) | ✅ **Approved: final.** Build exactly as designed. |
| Expanded player | 🔄 In review |

---

## Mini player: approved, final

> ✅ **This design is final.** The owner approved it as perfect. Don't change proportions, spacing or content without asking first.

![Mini player](./mini-player.png)

Source: [`mini-player.html`](./mini-player.html) (a static mockup; open it in a browser, not part of the build).

### Placement

- Only on **Thuis**, docked directly above the bottom navigation. It never appears on room pages.
- The card has one **page per device**. With two pages, you swipe horizontally between them.

### Pages

**Sonos page** (always present: it's also how you start music)

| Row | Playing | Idle |
|---|---|---|
| Top | Cover (54px, radius 14) · station/title (16px, 600) · current track (13px, muted) · pause button | Radio icon tile (54px) · "Muziek op Sonos" · "Kies een stream om te beginnen" |
| Bottom | Stream buttons, the active one outlined in the accent color | Stream buttons |
| While starting | n/a | Top row reads "Starten…" / "Even geduld, de stream laadt"; the tapped button shows a spinner instead of its logo |

**Chromecast page** (only while something is casting)

- Top: a 16:9 thumbnail (112×63, radius 12), the **title only** (up to 2 lines; no app, episode or TV name), and a pause button.
- Bottom: a progress bar with times (`32:10 ─── −19:40`).

### Stream buttons

- Pills 34px high: a colored dot "logo" (26px, gradient), then a short name in 13px/600. 6px gap; they share the width equally.
- A tap calls `script.turn_on` for that stream's script (fire and forget). The spinner shows until the Sonos reports `playing`, and gives up after about 10 s with "Dat lukte niet".
- Configured in code, e.g. `{ script: 'script.sonos_klara', name: 'Klara', color: … }`.

### Dimensions

- Card: padding 12px, radius 24px, 10px between rows, **fixed height 122px for every page**, so swiping never changes the height.
- Below the card: page dots (6px; the active one is a 16px pill). They're only shown when there are 2 pages.

### Swiping

- The card follows your finger, then always **snaps to a whole page**: past about ⅓ of the width or with a quick flick it moves to the next page, otherwise it springs back. It never rests halfway and moves one page per swipe.
- Implementation: CSS `scroll-snap-type: x mandatory` and `scroll-snap-stop: always`.

### Which pages are shown

| Chromecast | Sonos | Pages |
|---|---|---|
| idle | idle | Sonos (idle + streams), no dots |
| playing | idle | Chromecast ⇄ Sonos (idle + streams) |
| idle | playing | Sonos (playing + streams), no dots |
| playing | playing | Chromecast ⇄ Sonos (playing + streams) |

The device that started most recently is the first page. "Playing" includes paused.

### Interactions

- Tapping the top row opens the **expanded player** for that device (in review).
- Pause/play in the card works directly, without opening anything.

---

## Open questions

- **Active stream detection:** match the Sonos `media_title` against the stream name, or have each script store its choice in an `input_select`/`input_text` helper?
- **Stream names and scripts:** to be provided.
- **Entity IDs:** the Sonos group and the Chromecast, to be provided.
