# CLAUDE.md

Instructions for Claude when working in this repository.

## Coding style

- **Callbacks: name the steps, then return.** When a callback (or any small
  function) does more than one thing, give it a block body: put each value in
  a well-named `const`, then `return` a condition that reads like a sentence.
  Avoid packing everything into one long expression.

  ```ts
  when: (e, states) => {
    const batteryPercentage = Number(e.state);
    const chargingState = states['sensor.jeroens_ipad_battery_state']?.state;

    return batteryPercentage <= 20 && chargingState !== 'Charging';
  },
  ```

  A one-liner is fine when there's only one value, e.g. ``detail: (e) => `${e.state}%` ``.
- **Keep logic where it's used.** Write a rule's callback inline in that rule;
  don't move it into a separate helper or file.
