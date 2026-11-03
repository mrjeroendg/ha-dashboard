# Day tile

A reusable tile for **a total for today (so far)**: the name with its icon, the value, and optionally a bar against an ordinary day and the amount in euros. Dark mode only.

> ✅ **Approved (C1) and built** (4 November). The shared component for every tile that shows a total for today: see the design rule in `CLAUDE.md`. Don't change proportions or behaviour without asking first.
>
> Code: `DayTile` in `src/components/DayTile.tsx`, styles under "Day tile" in `src/styles.css`. First used by [Vandaag tot nu](../energie-vandaag/README.md).

The options for extra information (E1: yesterday, E2: per hour, E3: euros, E4: against an ordinary day): [`options.png`](./options.png) ([`options.html`](./options.html)). E3 and E4 combined, C1 and C3: [`mockup.png`](./mockup.png) ([`mockup.html`](./mockup.html)). As built (dev mode, mock values, placeholder prices):

![Built](./built.png)

## Usage

```tsx
<DayTile
  name="Afgenomen"
  icon="pylon"
  color={ENERGY_NOW.fromGridColor}
  value={4.82}
  unit="kWh"
  decimals={2}
  average={6.1}   // optional: the bar and "Gem. 6,10"
  euros={1.45}    // optional: "≈ € 1,45"
/>
```

Side by side in a `day-tiles` grid (two columns, 10px gap).

## The tile

- **Name** (13px, muted) with its **icon** (16px) in `color`.
- **Value** (26px, 600, fixed-width digits) with `decimals` decimals, and the unit (13px, muted).
- **With `average`:** a bar (6px, radius 3). The fill is today in `color`; the **white mark** is the average. The bar ends a quarter past the larger of the two, so neither touches the end: today past the mark means more than an ordinary day.
- **The line under it** (12px, muted): "Gem. 6,10" with `average`, "≈ **€ 1,45**" with `euros` (the amount bold and white), joined by " · ". Without either, no line. One line only: too long is cut off with "…".
- Without `average` and `euros` it's just the name and the value.

## Where the values come from

The tile only shows what it's given. The page that uses it fetches the rest. For "Vandaag tot nu", the average is that of the 7 days before today, from HA's daily statistics (`fetchDailyTotals`), and the euros are today's value times a price from the config.
