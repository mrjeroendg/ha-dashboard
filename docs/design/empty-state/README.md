# Empty state in sheets

> ✅ **The default for every sheet from now on** (the owner's decision). A sheet that can end up with nothing to list shows this, never an empty frame.
>
> Code: `EmptyState` in `src/components/EmptyState.tsx`, styles under "empty state" in `src/styles.css`.

- **A small tile with an icon,** centred: 48px, radius 16, `--surface` with the thin border, the icon in the accent colour.
- **One short line below it,** 14px, muted. It says plainly that there's nothing, in the sheet's own words: "Alles staat uit", "Geen afspraken meer".
- **No buttons and no explanation.** The sheet's title and its own controls (e.g. "Bijwerken") stay where they are.

## Used in

| Sheet | Icon | Text |
|---|---|---|
| Wat staat aan | `check` | Alles staat uit |
| Oppas nodig | `check` | Geen afspraken meer |
