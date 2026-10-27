import { useLayoutEffect, useRef, useState } from 'react';
import type { StatusItem } from '../lib/houseStatus';
import { Icon } from './Icon';

/** The band always moves at the same speed, however many items it has. */
const SPEED_IN_PIXELS_PER_SECOND = 30;

interface Props {
  statusItems: StatusItem[];
  /** Tapping the band opens "Nu". */
  onOpen(): void;
}

/**
 * The status band on Thuis (docs/design/now-ticker): every item scrolls by
 * from right to left, endlessly, also when they'd all fit. The items are in
 * it twice, so moving it half its width loops without a seam.
 */
export function StatusTicker({ statusItems, onOpen }: Props) {
  const belt = useRef<HTMLDivElement>(null);
  const [secondsPerRound, setSecondsPerRound] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const beltElement = belt.current;
    if (!beltElement) return;

    const updateSpeed = () => {
      const widthOfOneRound = beltElement.offsetWidth / 2;
      setSecondsPerRound(widthOfOneRound / SPEED_IN_PIXELS_PER_SECOND);
    };

    updateSpeed();
    const observer = new ResizeObserver(updateSpeed);
    observer.observe(beltElement);
    return () => observer.disconnect();
  }, []);

  const readableStatus = statusItems.map((statusItem) => [statusItem.highlighted, statusItem.text].filter(Boolean).join(' ')).join(', ');

  return (
    <div
      className="status-ticker"
      role="button"
      tabIndex={0}
      aria-label={readableStatus}
      onClick={onOpen}
      onKeyDown={(keyboardEvent) => {
        const isOpenKey = keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ';
        if (isOpenKey) onOpen();
      }}
    >
      <div className="status-ticker__window" aria-hidden>
        <div
          ref={belt}
          className="status-ticker__belt"
          style={secondsPerRound ? { animationDuration: `${secondsPerRound}s` } : undefined}
        >
          {[0, 1].map((round) =>
            statusItems.map((statusItem, position) => (
              <span key={`${round}-${position}`} className="status-ticker__item">
                <span className="status-ticker__icon" style={statusItem.iconColor ? { color: statusItem.iconColor } : undefined}>
                  <Icon name={statusItem.icon} />
                </span>
                <span>
                  {statusItem.highlighted && <span className="status-ticker__highlighted">{statusItem.highlighted}</span>}
                  {statusItem.highlighted && statusItem.text && ' '}
                  {statusItem.text}
                </span>
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
