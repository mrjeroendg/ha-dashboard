import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { openMoreInfo } from '../lib/moreInfo';
import type { ColorChoice, LightColor, RGB } from '../lib/rooms';

interface Props {
  entityId: string;
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

/**
 * Preset swatches plus a "custom" swatch. Inside HA the custom swatch opens
 * HA's own light dialog (color wheel); in dev, where there is no HA frontend,
 * it falls back to the browser's native color input.
 */
export function ColorPicker({ entityId, color, draft, label, onPick }: Props) {
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

  // Bring the selected swatch into view when it sits beyond the visible part
  // (scrolls only this row sideways, never the page).
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ scrolled: false, end: false });
  const updateEdges = () => {
    const el = row.current;
    if (el) setEdges({ scrolled: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };
  useLayoutEffect(updateEdges, []);
  const selected = customRgb ? -2 : activeIndex;
  useEffect(() => {
    const el = row.current;
    const swatch = el?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!el || !swatch) return;
    if (swatch.offsetLeft + swatch.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: swatch.offsetLeft - el.clientWidth / 2, behavior: 'smooth' });
    }
  }, [selected]);

  return (
    <div
      className={`color-picker${edges.scrolled ? ' is-scrolled' : ''}${edges.end ? ' is-end' : ''}`}
      role="radiogroup"
      aria-label={`Kleur ${label}`}
      ref={row}
      onScroll={updateEdges}
    >
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
      {color.supportsColor &&
        (import.meta.env.DEV ? (
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
        ) : (
          <button
            type="button"
            role="radio"
            aria-label="Meer kleuren"
            aria-checked={Boolean(customRgb)}
            className={`swatch swatch--custom${customRgb ? ' is-custom' : ''}`}
            style={customRgb ? ({ '--swatch': rgb(customRgb) } as CSSProperties) : undefined}
            onClick={(e) => openMoreInfo(e.currentTarget, entityId)}
          />
        ))}
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
