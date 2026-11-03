# Energie: Vandaag tot nu

What the P1 meter counted since midnight, on the [Energie](../nav-categories/README.md) page under [Dit kwartier](../energie-kwartier/README.md). Dark mode only.

> ✅ **Approved and built** (4 November): two tiles side by side, the **net** figures from the P1 meter, each as the shared [day tile](../day-tile/README.md) (C1): against an ordinary day and in euros. Don't change proportions or behaviour without asking first.
>
> Code: `TodaySoFar.tsx` in `src/components/energy/`, `ENERGY_TODAY` in `src/config/energy.ts`, `DayTile`, the `pylon` icon in `Icon.tsx`.

The earlier options (A: three tiles, B: a list, C: a balance, D: four tiles with water): [`options.png`](./options.png) ([`options.html`](./options.html)). Instead, the owner chose two tiles, without gas or water, then the extra information of the day tile. As built (dev mode, mock values, placeholder prices):

![Built](./built.png)

## The tiles

| Tile | Icon | Sensor | Price |
|---|---|---|---|
| **Afgenomen** (taken from the grid) | pylon, pink `#d55181` | `sensor.p1_meter_energy_consumption_daily` | what taking costs per kWh |
| **Teruggeleverd** (fed back) | sun, green `#6bab3e` | `sensor.p1_meter_energy_production_daily` | what feeding back earns per kWh |

- In kWh with two decimals, straight from the sensors' states (live). The colours are the ones of the Nu card.
- **Net, not gross:** what went through the meter, not what the house used or the panels made (that would need Smappee).
- **The bar:** today against the average of the **7 days before today** (`ENERGY_TODAY.daysInAverage`), from HA's daily statistics of the same sensors, fetched again every 5 minutes. No bar while HA has no statistics yet.
- **"≈ € …":** today's kWh times `ENERGY_TODAY.euroPerKilowattHour`. **The prices in the config are placeholders (€0,30 and €0,04) until the owner fills in the ones from the bill.** An indication only: the bill also has fixed costs, the capaciteitstarief and taxes; a dynamic tariff isn't one price.
- Without either sensor there's no section.
- *No section title "Vandaag tot nu" any more:* since S2 ([energie-page](../energie-page/README.md)) the tiles sit under the card for now.
