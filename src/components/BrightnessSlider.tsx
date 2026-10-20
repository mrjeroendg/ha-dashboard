import type { CSSProperties } from 'react';
import { Icon } from './Icon';

interface Props {
  /** 1–100 */
  value: number;
  label: string;
  onInput(value: number): void;
}

/** Full-width pill slider; the accent fill shows the brightness. */
export function BrightnessSlider({ value, label, onInput }: Props) {
  return (
    <label className="slider" style={{ '--pct': `${value}%` } as CSSProperties}>
      <Icon name="sun" />
      <input
        type="range"
        min={1}
        max={100}
        value={value}
        aria-label={`Helderheid ${label}`}
        onChange={(e) => onInput(Number(e.currentTarget.value))}
      />
      <span className="slider__value">{value}%</span>
    </label>
  );
}
