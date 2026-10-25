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

## Aircos in the status line

Next to lights and openings, the status line on Thuis also counts the aircos that are on: "Iedereen thuis · 1 licht aan · 2 airco's aan". One extra list in `src/config/status.ts`, like `lights`.

## Jaqueline as a warning

When the lawn mower is stuck, lifted, offline or has another error, a red warning on Thuis: "Jaqueline zit vast · sinds 14:02", with "Bekijk" opening her sheet. Only when something's wrong; rain delay doesn't count. A rule in `src/config/attention.ts`, using `mowerStatus` from `src/lib/mower.ts`. **Waits for `claude/lawn-mower` to be merged.**
