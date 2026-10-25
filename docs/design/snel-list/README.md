# Snel as a list, with slim controls

"Snel" on Thuis becomes one list of controls (option C), in the slim variant (S1). Dark mode only.

> ✅ **Approved (C + slim S1) and built.** Don't change proportions or behaviour without asking first.
>
> Code: `EntityControl` in `src/components/EntityControl.tsx` (extracted from `RoomView.tsx`, shared by the rooms and Snel), `QuickActions.tsx`, styles under "slim controls" in `src/styles.css`.

Options for Snel: [`options.png`](./options.png) ([`options.html`](./options.html)). The slim variants: [`slim.png`](./slim.png) ([`slim.html`](./slim.html)). As built (dev mode, mock data), and right after tapping "Start":

![Built](./built.png)

## The list (C)

- **One card, one row per shortcut,** in the order of `src/config/shortcuts.ts`. No grouping; a new shortcut is simply a new row.
- **Each row is the same control as in a room** (`EntityControl`): the domain decides what a tap does. "Start" for a scene or script, a switch for a light or switch, and so on. The feedback is the same too: the checkmark in "Start" after a tap, "Dat lukte niet" on an error.
- **Only an icon, a name and the control.** No second line, except "Dat lukte niet".
- **The config stays separate** from the rooms: label, icon and entity. Nothing is looked up in the rooms config. A shortcut whose entity doesn't exist in HA is left out, as in a room.

## Slim (S1)

The room controls, smaller; pure CSS (`row-group--slim`), the same markup:

| | Room | Slim |
|---|---|---|
| Row | 60px, padding 12px 16px, gap 14px | 44px, padding 8px 14px, gap 12px |
| Icon tile | 36px, radius 12, icon 20px | 28px, radius 9, icon 16px |
| Name | 16px | 15px |
| "Start" | 32px high | 26px high, 12px text |
| Switch | 48 × 30 | 40 × 24 |

## Not chosen

- **For Snel:** A · compact cards in two columns, B · round buttons like the iOS Control Center, D · pills. The old large tiles are gone; the small cards stay for Snel in the room tabs.
- **For slim:** S2 · a bare icon with "Start" as text, S3 · like iOS Settings.
