# CLAUDE.md

Instructions for Claude when working in this repository.

## Coding style

- **Callbacks: name the steps, then return.** When a callback (or any small
  function) does more than one thing, give it a block body: put each value in
  a well-named `const`, then `return` a condition that reads like a sentence.
  Avoid packing everything into one long expression.

  ```ts
  when: (batteryEntity, states) => {
    const batteryPercentage = Number(batteryEntity.state);
    const chargingState = states['sensor.jeroens_ipad_battery_state']?.state;

    return batteryPercentage <= 20 && chargingState !== 'Charging';
  },
  ```

  A one-liner is fine when there's only one value, e.g. ``detail: (batteryEntity) => `${batteryEntity.state}%` ``.

- **Descriptive names, even when long.** Name a variable after what it holds
  and where it comes from, so the code reads without comments. No
  abbreviations or single letters (`k`, `v`, `pct`, `e`, `m`), also not in
  callbacks. Booleans read as a question: `is…`, `has…`, `can…`.

  ```ts
  const differenceAppAndHass = Math.abs(currentKelvinFromEntity - currentKelvinInApp);
  const allowedDifferenceBetweenAppAndHass = 60;
  const isDifferenceMarginal = differenceAppAndHass <= allowedDifferenceBetweenAppAndHass;

  return isDifferenceMarginal ? currentKelvinInApp : currentKelvinFromEntity;
  ```

  Applies to new and changed code; existing code is renamed when it's touched.

- **Entities only through the `Entity` enum** (`src/config/entities.ts`), never
  as a raw ID in the config or the code. A new entity gets a member there
  first: UPPER_SNAKE_CASE, room first, then what it is
  (`MARIELOU_ROLLER_SHUTTER_MY_POSITION`). The config types accept only
  `Entity`. The dev mock (`src/dev/`) keeps raw IDs.

## Design rules

- **Empty sheets:** a sheet that can have nothing to list shows the shared
  `EmptyState` (docs/design/empty-state) with its own short text, never an
  empty frame.
