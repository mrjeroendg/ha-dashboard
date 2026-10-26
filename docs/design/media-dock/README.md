# Media dock: shortcuts in the navigation

The media card on Thuis takes less room. The app and station buttons move into a row on top of the bottom navigation, and the card only shows while something plays, as a slim player. Dark mode only. Changes the [media card](../media-card/README.md).

> ✅ **Approved (option J).** Not built yet. Don't change proportions or behaviour without asking first.

![Design](./mockup.png)

Source: [`options.html`](./options.html), the "J" screens. G and H were not chosen; the other options are in [`options.png`](./options.png).

## Why

The idle card (122px plus page dots) sat above the navigation all the time and covered half of Verbruik, while its top row ("TV op Chromecast · Kies een app om te openen") said nothing the buttons didn't. The buttons are used a lot, so they stay one tap away.

## The row in the navigation

- **Only on Thuis.** On room pages the navigation stays as it is.
- **Part of the navigation:** the same surface, on top of the tabs, with a hairline between them.
- **Left: a TV | Sonos switch** (two icons in a small segmented pill). A tap switches the row between the two devices.
- **Right: that device's three buttons**, equal width: Netflix, VRT, VTM for the TV; Radio 1, StuBru, Tijdloze for the Sonos. Chips 28px high, a 16px colour circle and the name in 12px/600.
- **Names:** "VRT" (was VRT MAX) and "VTM" (was VTM GO).
- A tap does what the buttons do now: an app opens on the iPhone, a station starts on the Sonos (with the spinner until it plays).

## While something plays

- **A slim player above the navigation**, about 56px: picture (72×40), title, app or track below it, pause, and a thin progress line along the bottom edge.
- **Tap opens the expanded player**, as now. Pause works directly.
- **Swipe** between TV and Sonos like the current card, with page dots below it, when both play.
- **The switch follows the slim player's page.**
- **Nothing playing → no player**, only the row.

## Replaces in the media card

The mini player's idle pages, its stream and app button rows and its progress row with times (the times stay in the expanded player).
