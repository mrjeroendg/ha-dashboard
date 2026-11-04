# Energie: the sheets behind the day tiles

A tap on a day tile on Energie opens a sheet with more about it: **Afgenomen**, **Zon** and **Gas**. (A Water sheet was built too, and removed with the water meter on 4 November.) Dark mode only.

> 🛠 **Built without a design first**, at the owner's request ("no design, just build it; I'll review the code and app later"). Everything below is open to change.
>
> Code: `MeterSheet.tsx` (the shared sections), `InfoSheet.tsx` (the shared parts), `ElectricitySheet.tsx`, `SolarSheet.tsx`, and `GasSheet.tsx` in `src/components/energy/`; `DayTile`'s `onOpen`; `fetchHourlyTotalsToday`, `fetchEarlierMonthlyTotals` in `src/lib/statistics.ts`; styles under "Info sheets" in `src/styles.css` (shared with the [Capaciteitstarief](../energie-capaciteit/README.md) sheet).

As built (dev mode, mock values):

| Afgenomen | Zon | Gas |
|---|---|---|
| ![Afgenomen](./built-electricity.png) | ![Zon](./built-solar.png) | ![Gas](./built-gas.png) |

## Opening

A tap anywhere on the day tile (`DayTile`'s `onOpen`). A small "›" right after the tile's name shows it ("Afgenomen vandaag ›"), the shared `LinkChevron`, the owner's choice (option A in [`tappable.png`](./tappable.png), [`tappable.html`](./tappable.html); more ideas in [`tappable-more.png`](./tappable-more.png), [`tappable-more.html`](./tappable-more.html)).

## In every sheet (`MeterSheet`)

- **Vandaag** and **Deze maand**, with "≈ €" (not for Zon). This month = the days before today this month (daily statistics) + today's state.
- **Vandaag per uur:** 24 bars from midnight (hourly statistics, `change`); the current hour, which HA has no statistics for yet, is today so far minus the hours before it, in the full colour. Labels under 0u, 6u, 12u and 18u.
- **Laatste 12 maanden:** 11 months from the monthly statistics plus this month so far, with the average of the earlier months as a dashed line. (A line "November loopt nog; vorig jaar …" under it was removed at the owner's request.)
- **Laatste 30 dagen:** the average day and the highest day, with its date.
- **Every chart in a sheet has a y-axis** (4 November, the owner's request: only in the sheets, not on the tiles): 0 to just above the highest bar in about 4 round steps of whole numbers (`roundAxis`: 1, 2, 5 or 10 × a power of ten), muted labels **without unit and without decimals** (the owner's choice: the sheet already says the unit), and faint horizontal lines at each step (`axisOptions`, shared with the Capaciteitstarief sheet). The labels sit a little left of the plot, so the average's label doesn't cover them.
- A section that has no statistics yet is left out.

## Per sheet

No "Goed om te weten" sections and no explanatory paragraph under the sluipverbruik (removed at the owner's request, 4 November).

- **Afgenomen** (`sensor.p1_meter_energy_consumption_daily`, pink): only the shared sections. Its **Sluipverbruik** moved to the [Huis sheet](../energie-huis/README.md) (4 November): it's what the house uses, not only what came from the grid. There it's Smappee's always-on (`sensor.garage_smappee_always_on_active_power`, the lowest power of the last 2 days, with what that is per year at €0,35 per kWh) and what it used today (`sensor.garage_smappee_always_on_today`, in kWh, with ≈ €). Before, it was the lowest hour of the P1 meter last night, which assumed everyone asleep and no sun.
- **Zon** (Smappee, yellow, no €): **Waar ging je zon heen vandaag:** used and injected (the P1 meter), each with its share, and what the solar used yourself saved at the price of taking.
- **Gas** (purple): only the shared sections.

## Assumptions to check

- Smappee's always-on is the lowest of 2 days; how short its readings are isn't documented, so a moment with everything off could pull it down a little.
