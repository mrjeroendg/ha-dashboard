# Energie: Vandaag tot nu

What the P1 meter counted since midnight, on the [Energie](../nav-categories/README.md) page under [Dit kwartier](../energie-kwartier/README.md). Dark mode only.

> ✅ **Approved and built** (4 November): two tiles side by side, the **net** figures from the P1 meter. Don't change proportions or behaviour without asking first.
>
> Code: `TodaySoFar.tsx` in `src/components/energy/`, `ENERGY_TODAY` in `src/config/energy.ts`, the `pylon` icon in `Icon.tsx`, styles under "Energie: Vandaag tot nu" in `src/styles.css`.

The earlier options (A: three tiles, B: a list, C: a balance, D: four tiles with water): [`options.png`](./options.png) ([`options.html`](./options.html)). Instead, the owner chose two tiles, without gas or water. As built (dev mode, mock values):

![Built](./built.png)

## The tiles

| Tile | Icon | Sensor |
|---|---|---|
| **Afgenomen** (taken from the grid) | pylon, pink `#d55181` | `sensor.p1_meter_energy_consumption_daily` |
| **Teruggeleverd** (fed back) | sun, green `#6bab3e` | `sensor.p1_meter_energy_production_daily` |

- In kWh with two decimals, 26px, straight from the sensors' states (live, nothing fetched). The colours are the ones of the Nu card.
- **Net, not gross:** what went through the meter, not what the house used or the panels made (that would need Smappee).
- Without either sensor there's no section.
