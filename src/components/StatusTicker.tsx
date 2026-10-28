import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { StatusItem } from '../lib/houseStatus';
import { Icon } from './Icon';

interface Props {
  statusItems: StatusItem[];
  /** Tapping the band opens "Nu". */
  onOpen(): void;
}

/**
 * The status band on Thuis (docs/design/now-ticker). You swipe it sideways
 * yourself; the browser does the moving. When there's more than fits, a
 * small track at the bottom shows how far you've swiped.
 */
export function StatusTicker({ statusItems, onOpen }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hasMoreThanFits, setHasMoreThanFits] = useState(false);
  // 0 at the start, 1 at the end.
  const [scrolledFraction, setScrolledFraction] = useState(0);

  const updateScrolledFraction = () => {
    const scrollerElement = scroller.current;
    if (!scrollerElement) return;

    const scrollableDistance = scrollerElement.scrollWidth - scrollerElement.clientWidth;
    const fraction = scrollableDistance > 0 ? scrollerElement.scrollLeft / scrollableDistance : 0;
    // iOS lets the band bounce past both ends; the track stays on its ends.
    const fractionWithinTheTrack = Math.min(Math.max(fraction, 0), 1);

    setScrolledFraction(fractionWithinTheTrack);
  };

  // New items can make the band longer or shorter: is there still more than fits?
  useLayoutEffect(() => {
    const scrollerElement = scroller.current;
    if (!scrollerElement) return;

    setHasMoreThanFits(scrollerElement.scrollWidth > scrollerElement.clientWidth);
    updateScrolledFraction();
  }, [statusItems]);

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
      <div ref={scroller} className="status-ticker__scroller" onScroll={updateScrolledFraction} aria-hidden>
        <div className="status-ticker__items">
          {statusItems.map((statusItem, position) => (
            <span key={position} className="status-ticker__item">
              <span className="status-ticker__icon" style={statusItem.iconColor ? { color: statusItem.iconColor } : undefined}>
                <Icon name={statusItem.icon} />
              </span>
              <span>
                {statusItem.highlighted && <span className="status-ticker__highlighted">{statusItem.highlighted}</span>}
                {statusItem.highlighted && statusItem.text && ' '}
                {statusItem.text}
              </span>
            </span>
          ))}
        </div>
      </div>
      {hasMoreThanFits && (
        <span className="status-ticker__track" aria-hidden>
          <span className="status-ticker__thumb" style={{ '--scrolled-fraction': scrolledFraction } as CSSProperties} />
        </span>
      )}
    </div>
  );
}
