import type { CSSProperties } from 'react';
import type { ColorChoice, LightColor, RGB } from '../lib/rooms';

interface Props {
  color: LightColor;
  /** Pending choice while it's being sent; shown as selected right away. */
  draft: ColorChoice | null;
  label: string;
  onPick(choice: ColorChoice): void;
}

interface Swatch {
  name: string;
  choice: ColorChoice;
  /** What the swatch looks like (for whites: an approximation of the temperature). */
  display: RGB;
}

const WHITES: Swatch[] = [
  { name: 'Warm wit', choice: { kelvin: 2700 }, display: [255, 196, 137] },
  { name: 'Neutraal wit', choice: { kelvin: 4000 }, display: [255, 228, 206] },
  { name: 'Koel wit', choice: { kelvin: 6000 }, display: [232, 238, 255] },
];

const COLORS: Swatch[] = [
  { name: 'Amber', choice: { rgb: [255, 147, 41] }, display: [255, 147, 41] },
  { name: 'Koraal', choice: { rgb: [255, 94, 77] }, display: [255, 94, 77] },
  { name: 'Roze', choice: { rgb: [255, 105, 180] }, display: [255, 105, 180] },
  { name: 'Lavendel', choice: { rgb: [150, 110, 255] }, display: [150, 110, 255] },
  { name: 'Blauw', choice: { rgb: [40, 110, 255] }, display: [40, 110, 255] },
  { name: 'Groen', choice: { rgb: [60, 200, 110] }, display: [60, 200, 110] },
];

/** Preset swatches plus a custom color via the native (iOS) color picker. */
export function ColorPicker({ color, draft, label, onPick }: Props) {
  const swatches = [
    ...(color.supportsTemp
      ? WHITES.map((w) => ({ ...w, choice: { kelvin: clampKelvin(w.choice, color) } }))
      : []),
    ...(color.supportsColor ? COLORS : []),
  ];

  const current: ColorChoice | null =
    draft ?? (color.kelvin !== undefined ? { kelvin: color.kelvin } : color.rgb ? { rgb: color.rgb } : null);
  const activeIndex = current ? swatches.findIndex((s) => matches(s.choice, current)) : -1;
  const customRgb = activeIndex === -1 && current && 'rgb' in current ? current.rgb : undefined;

  return (
    <div className="color-picker" role="radiogroup" aria-label={`Kleur ${label}`}>
      {swatches.map((s, i) => (
        <button
          key={s.name}
          type="button"
          role="radio"
          aria-checked={i === activeIndex}
          aria-label={s.name}
          className="swatch"
          style={{ '--swatch': rgb(s.display) } as CSSProperties}
          onClick={() => onPick(s.choice)}
        />
      ))}
      {color.supportsColor && (
        <label
          className={`swatch swatch--custom${customRgb ? ' is-custom' : ''}`}
          aria-checked={Boolean(customRgb)}
          style={customRgb ? ({ '--swatch': rgb(customRgb) } as CSSProperties) : undefined}
        >
          <input
            type="color"
            aria-label="Eigen kleur"
            value={toHex(customRgb ?? color.rgb ?? [255, 255, 255])}
            onChange={(e) => onPick({ rgb: fromHex(e.currentTarget.value) })}
          />
        </label>
      )}
    </div>
  );
}

function clampKelvin(choice: ColorChoice, color: LightColor): number {
  const k = 'kelvin' in choice ? choice.kelvin : 4000;
  return Math.min(color.maxKelvin, Math.max(color.minKelvin, k));
}

/**
 * HA converts colors (rgb → xy/hs → rgb), so the value it reports back is
 * rarely exactly what was sent. Treat "close enough" as the same swatch.
 */
function matches(a: ColorChoice, b: ColorChoice): boolean {
  if ('kelvin' in a && 'kelvin' in b) return Math.abs(a.kelvin - b.kelvin) < 300;
  if ('rgb' in a && 'rgb' in b) {
    const d = Math.hypot(a.rgb[0] - b.rgb[0], a.rgb[1] - b.rgb[1], a.rgb[2] - b.rgb[2]);
    return d < 40;
  }
  return false;
}

const rgb = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
