import type { CSSProperties } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  name: string;
  icon: IconName;
  /** The icon and the bar. */
  color: string;
  /** Today so far. */
  value: number;
  unit: string;
  decimals: number;
  /** An ordinary day: shows the bar, with its white mark, and "Gem. 6,10". */
  average?: number;
  /** Shows "≈ € 1,45". */
  euros?: number;
}

/** The bar's end: a little past the larger of today and the average, so neither touches it. */
const BAR_ROOM = 1.25;

/**
 * A day's total so far (docs/design/day-tile): the name with its icon, the
 * value, and optionally a bar against an ordinary day (the white mark) and one
 * line with the average and the amount in euros. Shared by every tile that
 * shows a total for today.
 */
export function DayTile({ name, icon, color, value, unit, decimals, average, euros }: Props) {
  const hasAverage = average !== undefined;
  const hasEuros = euros !== undefined;
  const barEnd = Math.max(value, average ?? 0) * BAR_ROOM || 1;
  const shareOfBar = (amount: number) => `${Math.min(1, amount / barEnd) * 100}%`;
  const readable = (amount: number) => amount.toLocaleString('nl-BE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="day-tile" style={{ '--day-tile-color': color } as CSSProperties}>
      <p className="day-tile__name">
        <Icon name={icon} />
        {name}
      </p>
      <p className="day-tile__value">
        {readable(value)}
        <small>{unit}</small>
      </p>
      {hasAverage && (
        <div className="day-tile__bar" aria-hidden>
          <span className="day-tile__fill" style={{ width: shareOfBar(value) }} />
          <span className="day-tile__average" style={{ left: shareOfBar(average) }} />
        </div>
      )}
      {(hasAverage || hasEuros) && (
        <p className="day-tile__extra">
          {hasAverage && `Gem. ${readable(average)}`}
          {hasAverage && hasEuros && ' · '}
          {hasEuros && (
            <>
              ≈ <b>{euros.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' })}</b>
            </>
          )}
        </p>
      )}
    </div>
  );
}
