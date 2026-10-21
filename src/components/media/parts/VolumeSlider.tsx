import type { CSSProperties } from 'react';
import { useDebouncedCommit } from '../../../hooks/useDebouncedCommit';
import { Icon } from '../../Icon';

interface Props {
  /** 0–100 */
  value: number;
  /** Sends the new volume; called once you pause dragging, not on every pixel. */
  onCommit(value: number): Promise<unknown>;
}

/** Pill-shaped volume slider (same style as the light brightness slider). */
export function VolumeSlider({ value, onCommit }: Props) {
  const [draft, setDraft] = useDebouncedCommit<number>(onCommit);
  const shown = draft ?? value;

  return (
    <label className="slider slider--volume" style={{ '--pct': `${shown}%` } as CSSProperties}>
      <Icon name="volume" />
      <input
        type="range"
        min={0}
        max={100}
        value={shown}
        aria-label="Volume"
        onChange={(e) => setDraft(Number(e.currentTarget.value))}
      />
      <span className="slider__value">{shown}%</span>
    </label>
  );
}
