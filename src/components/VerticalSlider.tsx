import type { PointerEvent, ReactNode } from 'react';

interface Props {
  /** Current value, or undefined when unknown (no knob, no fill). */
  value?: number;
  min: number;
  max: number;
  /** Values snap to this step. */
  step?: number;
  label: string;
  disabled?: boolean;
  /** Track background, e.g. the warm-to-cool gradient. */
  background: string;
  /** 'knob': a white bar at the value (warmth). 'fill': filled up to the value (brightness). */
  look: 'knob' | 'fill';
  /** Fill colour, for look 'fill'. */
  fillBackground?: string;
  /** Shown at the bottom of the track, e.g. a sun icon. */
  icon?: ReactNode;
  /** While dragging: move the knob. */
  onInput(value: number): void;
  /** On release (finger or mouse up): send the value. A tap counts too. */
  onCommit(value: number): void;
}

/**
 * Tall pill slider (docs/design/light-sheet): drag anywhere on it, bottom is
 * `min`, top is `max`. Vertical so it never fights the sheet's sideways swipe.
 */
export function VerticalSlider({
  value,
  min,
  max,
  step = 1,
  label,
  disabled,
  background,
  look,
  fillBackground,
  icon,
  onInput,
  onCommit,
}: Props) {
  const valueAtPointer = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    const track = pointerEvent.currentTarget.getBoundingClientRect();
    const distanceFromTop = Math.min(1, Math.max(0, (pointerEvent.clientY - track.top) / track.height));
    const distanceFromBottom = 1 - distanceFromTop;
    const unroundedValue = min + distanceFromBottom * (max - min);
    const valueOnStep = Math.round(unroundedValue / step) * step;

    return Math.min(max, Math.max(min, valueOnStep));
  };

  const positionFromBottom = value === undefined ? undefined : (value - min) / (max - min || 1);

  return (
    <div
      className={`vslider${disabled ? ' is-disabled' : ''}`}
      style={{ background }}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-disabled={disabled}
      onPointerDown={(pointerEvent) => {
        if (disabled) return;
        pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
        onInput(valueAtPointer(pointerEvent));
      }}
      onPointerMove={(pointerEvent) => {
        const isDraggingThisSlider = pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId);
        if (!disabled && isDraggingThisSlider) onInput(valueAtPointer(pointerEvent));
      }}
      onPointerUp={(pointerEvent) => {
        const isDraggingThisSlider = pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId);
        if (!disabled && isDraggingThisSlider) onCommit(valueAtPointer(pointerEvent));
      }}
      // The browser took the gesture over: treat it as letting go.
      onPointerCancel={(pointerEvent) => {
        if (!disabled) onCommit(valueAtPointer(pointerEvent));
      }}
    >
      {look === 'fill' && positionFromBottom !== undefined && (
        <span className="vslider__fill" style={{ height: `${positionFromBottom * 100}%`, background: fillBackground }} />
      )}
      {look === 'knob' && positionFromBottom !== undefined && (
        // Kept clear of the rounded ends.
        <span className="vslider__knob" style={{ bottom: `calc(14px + ${positionFromBottom} * (100% - 28px))` }} />
      )}
      {icon && <span className="vslider__icon">{icon}</span>}
    </div>
  );
}
