# Attention banner: warnings on Thuis

Warnings that need you to act, shown on **Thuis** directly under the status line. Dark mode only.

> ✅ **Approved (gradient A) and built.** The owner chose this design. Don't change colours, proportions or behaviour without asking first.
>
> Code: `src/config/attention.ts` (rules), `src/lib/attention.ts` (which warnings are active), `src/components/Attention.tsx`, styles under `attention` in `src/styles.css`.

![Attention banner](./mockup.png)

Source: [`mockup.html`](./mockup.html) (a static mockup; open it in a browser, not part of the build).

## Rules

- **Never closable.** There is no × anywhere. A warning disappears only when its cause is gone: the update is installed, the garage door is closed, the window is shut.
- **Always all of them, in a list.** Every active warning gets its own banner, stacked under the status line with 8px between them. There's no "+2 more" row and no sheet. With many warnings, "Snel" simply moves down.
- **Order:** highest level first; within a level, the newest first.
- **Every warning has an action button.** It either fixes the problem directly ("Sluiten" closes the garage door) or opens HA's own more-info dialog ("Bekijk"), for things the dashboard can't fix itself, like an update or an open window.
- With no warnings, nothing is shown: no empty space, no "all good" card.

## Banner

One row (padding 12px 12px 12px 14px, radius 20px, 12px gap):

| Part | Spec |
|---|---|
| Icon tile | 34px, radius 11px, filled with the level colour, 18px icon |
| Title | 15px / 600, `--text`, one line with ellipsis |
| Second line | 13px, a light tint of the level colour, one line with ellipsis (e.g. "Al 25 min · 22:04", "v3.3.1 → v3.3.4") |
| Action button | 32px high pill, 13px / 600, filled with the level colour |

**Background (gradient A):** a horizontal gradient: the level colour is strong on the left, behind the icon, and fades towards the right, into the card colour:

```css
background: linear-gradient(90deg,
  color-mix(in srgb, var(--c) calc(var(--tint) * 2.2), var(--surface)),
  color-mix(in srgb, var(--c) 4%, var(--surface)));
box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) var(--edge), transparent);
```

## Severity levels

| Level | `--c` | Second line | `--tint` | `--edge` | Text on icon/button | For example |
|---|---|---|---|---|---|---|
| **Hoog** (`high`) | `#b42318` dark red | `#f2a49c` | 30% | 85% | white | Safety or damage: garage door open, smoke alarm, leak, front door unlocked |
| **Middel** (`medium`) | `#e5534b` red | `#f0b3ae` | 16% | 45% | white | Needs attention today: window open while it's cold, battery almost empty |
| **Laag** (`low`) | `#e8913a` orange | `#f3c99a` | 13% | 40% | dark `#2b1a0a` (white is unreadable on orange) | Maintenance, whenever it suits you: updates |

The orange is deliberately yellower than the dashboard's accent (`#d97757`), so a low warning never looks like a normal shortcut.

## Home Assistant mapping

Warnings are defined in `src/config/attention.ts`, like the rooms and shortcuts. For example:

```ts
{ entity: 'update.*', level: 'low' },
{ level: 'high', entity: 'cover.garagepoort', after: 15,
  title: 'Garagepoort staat open', action: { label: 'Sluiten', service: 'cover.close_cover' } },
```

- **Updates:** `update.*` with state `on`. The second line is `installed_version → latest_version`, and "Bekijk" opens HA's update dialog.
- **`after`** (minutes): the warning only appears once the state has lasted that long (from `last_changed`). The second line shows how long, plus the time it started.
- **No `action`:** the button is "Bekijk", which opens the more-info dialog.
- **`when`:** the states that trigger it. Default: `open`/`opening` for a cover, `unlocked`/`open` for a lock, otherwise `on`.
- **Wildcards:** `entity` accepts `*`, and entities in `src/config/ignore.ts` are skipped. When two rules match one entity, the first one wins.
- **Action fails:** the second line shows "Dat lukte niet" for a moment, like the shortcuts.

## Not chosen

[`gradients.png`](./gradients.png) ([`gradients.html`](./gradients.html)) shows the gradient experiments:

- **B · Glow from the corner:** too subtle; the three levels look too much alike.
- **C · Full colour:** the most alarming, but "Middel" looked more urgent than the dark red "Hoog", and white text on orange was unreadable.
- **D · Gradient border:** refined, but the urgency only came through the icon and button.

Earlier rounds that were also dropped: a neutral info style with a close button, a single colour for every warning, and the "+2 andere meldingen" row with a sheet.
