# Warning stack

With two or more warnings, Thuis stacks them instead of listing them all, so "Snel" stays in view. Dark mode only. Builds on the [warnings](../attention-banner/README.md).

> ✅ **Approved and built (option A).** Don't change proportions or behaviour without asking first.
>
> Code: `Attention` in `src/components/Attention.tsx`, the motion in `src/hooks/useWarningStack.ts`, styles under "Stack" in `src/styles.css`.

![Design](./mockup.png)

Source: [`mockup.html`](./mockup.html). As built (dev mode, mock data with four warnings), stacked and opened:

![Built](./built.png)

## Behaviour

- **One warning:** a normal banner, as before. No badge, no stack.
- **Two or more, stacked:** the most important warning in front (same order as the list), with **"+N"** on the right for the warnings behind it. Up to two narrower cards peek out underneath, each in its own warning's colour.
- **Tap the stack:** all warnings in a list, exactly like before.
- **"Minder"** (centred, under the list) stacks them again. Opening the app again starts stacked; nothing is remembered.
- **"Bekijk"** on the front warning still opens that warning's sheet; it doesn't open the list.

## Motion (M1 · smooth)

Clickable prototype: [`motion.html`](./motion.html).

- **Opening:** the cards behind slide out of the stack to their place in the list and grow to full width; their content fades in. "Snel" slides down along with them. The "+N" shrinks away; "Minder" fades in as the cards arrive.
- **Closing:** the reverse. The cards slide back under the front one and only their coloured edge stays visible.
- **Curve:** the iOS sheet curve (`cubic-bezier(0.32, 0.72, 0, 1)`, 480 ms): fast start, calm finish. All cards move together.
- **Tap:** the front card dips slightly (98%) while pressed.
- The page opens stacked without animating. With "reduce motion" on in iOS, it switches without sliding.
- The cards peeking out are the real warning cards, shrunk and with their content hidden, so they can grow into place.

## Not chosen

- **M2 · springy motion**: the cards overshoot a little and leave one after another.

- **B · the stack opens a sheet** with all warnings.
- **C · one summary row** ("4 waarschuwingen" with a coloured dot per warning) that opens the sheet: the calmest, but you can't see what's wrong without tapping.
