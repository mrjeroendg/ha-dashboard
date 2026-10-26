# To do

Ideas that are agreed on but not built yet. Each one still needs an approved design before it's built.

## Solar surplus hint on the power card

While the house feeds back more than 1.5 kW for at least 15 minutes, the Verbruik power card shows a short hint that it's a good moment for the washing machine or dishwasher.

**In Home Assistant** (the logic lives there, so automations and notifications can use it too): a template binary sensor, no automation needed.

```yaml
template:
  - binary_sensor:
      - name: "Zonne-overschot"
        unique_id: zonne_overschot
        # Feeding back more than 1.5 kW…
        state: "{{ states('sensor.p1_meter_power') | float(0) < -1500 }}"
        # …for at least 15 minutes; off again after 5 minutes below it.
        delay_on: "00:15:00"
        delay_off: "00:05:00"
```

**In the dashboard:** while `binary_sensor.zonne_overschot` is on, a hint on the power card (`src/config/statistics.ts`, `StatisticsSection`). Design to do: where the hint goes and what it says, within the card's fixed 59px.

## Jaqueline as a warning

When the lawn mower is stuck, lifted, offline or has another error, a red warning on Thuis: "Jaqueline zit vast · sinds 14:02", with "Bekijk" opening her sheet. Only when something's wrong; rain delay doesn't count. A rule in `src/config/attention.ts`, using `mowerStatus` from `src/lib/mower.ts`.

## Snel by time of day

A shortcut only shows in Snel on Thuis during part of the day, e.g. "Pré slaapje" in the evening. A new optional `show: { from, until }` on an entry in `src/config/shortcuts.ts`, e.g. `show: { from: '18:00', until: '21:00' }`. Without `show`, a shortcut is always there, as now.

To decide in the design: what happens over midnight (`from: '22:00', until: '06:00'`), whether `from` and `until` can each be left out, and whether the list animates when a shortcut appears or disappears. The comment in `shortcuts.ts` ("no time or state logic") changes with it. Uses `useNow` (re-renders every minute).

## Remove a sitter appointment with a double tap

A double tap on an appointment in a sitter sheet ("Oppas nodig", "Oppas voor Cara") removes its todo item, e.g. one left behind after an outing moved to another date. `todo.remove_item` with the item's `uid` (`src/components/sheets/SitterSheet.tsx`); the list and the warning's count update by themselves. Removed, not completed: a completed item with the same title gets in the way of the automation.

To decide in the design: whether both sheets get it, and what the row shows while it's being removed or when it fails. "Nothing can be ticked off from the dashboard" in `docs/design/babysit/README.md` changes with it.
