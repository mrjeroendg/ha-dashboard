import type { CSSProperties, PointerEvent } from 'react';

interface Props {
  /** Current value, or undefined when unknown (no knob). */
  value?: number;
  min: number;
  max: number;
  /** Values snap to this step. */
  step?: number;
  label: string;
  disabled?: boolean;
  /** Track background, e.g. the warm-to-cool gradient. */
  background: string;
  onInput(value: number): void;
}

/**
 * Tall pill slider (docs/design/light-sheet): drag anywhere on it, bottom is
 * `min`, top is `max`. Vertical so it never fights the sheet's sideways swipe.
 */
export function VerticalSlider({ value, min, max, step = 1, label, disabled, background, onInput }: Props) {
  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const raw = min + fraction * (max - min);
    onInput(Math.min(max, Math.max(min, Math.round(raw / step) * step)));
  };

  const position = value === undefined ? undefined : (value - min) / (max - min || 1);

  return (
    <div
      className={`vslider${disabled ? ' is-disabled' : ''}`}
      style={{ background } as CSSProperties}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => {
        if (!disabled && e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
      }}
    >
      {position !== undefined && (
        // Kept clear of the rounded ends.
        <span className="vslider__knob" style={{ bottom: `calc(14px + ${position} * (100% - 28px))` }} />
      )}
    </div>
  );
}
