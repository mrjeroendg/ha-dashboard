# Bottom navigation: compact

The bar at the bottom with Thuis and the rooms, made more compact so more rooms fit. Dark mode only. Inspired by the Netflix iOS tab bar.

> ✅ **Approved (option B), not built yet.** Don't change proportions or behaviour without asking first.

![Options](./options.png)

Source: [`options.html`](./options.html). The chosen option is **B** (left, second row).

## Design (B)

- **Stacked items:** the icon (22px) above a small name (11px, medium weight), centred. Every item has the same fixed width (62px), so about 5½ items fit on a 390px-wide phone (the current bar fits about 3½).
- **Active item:** the orange tint of the room tabs, a soft orange area (`--accent-soft`) with the icon and name in orange (`--accent`). Rounded (24px) inside the bar.
- **The bar** keeps its look: the glassy pill with blur, now with a slightly smaller corner radius (30px) for the taller items.
- **Overflow stays as it is:** with more rooms than fit, the bar scrolls sideways, with soft fades on the edges, and the active item is scrolled into view.
- Tap gives the same selection haptic as now.

## Not chosen

- **A · Stacked, active as a lighter area** (closest to the Netflix example): the only place where "active" wouldn't be orange.
- **C · Icons only, the name only on the active item:** fits the most, but rooms would have to be recognised by their icon alone, and some icons look alike (Thuis and Garage are both houses).
- **D · Orange icon with a dot, no area:** the quietest, but the active item stands out less.
