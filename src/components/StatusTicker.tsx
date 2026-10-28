import { useEffect, useRef, useState } from 'react';
import type { StatusItem } from '../lib/houseStatus';
import { Icon } from './Icon';

const SPEED_IN_PIXELS_PER_SECOND = 30;
const REST_AT_THE_END_MS = 3000;
const BACK_TO_THE_START_MS = 700;
/** How often a band that fits checks whether it has to scroll after all. */
const CHECK_IF_IT_FITS_MS = 1000;

interface Props {
  statusItems: StatusItem[];
  /** Tapping the band opens "Nu". */
  onOpen(): void;
}

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

/**
 * The status band on Thuis (docs/design/now-ticker). When the items don't fit,
 * it scrolls to the end at 30px/s, rests there for 3 s, takes in what changed
 * meanwhile, slides back to the start and scrolls again. While it scrolls,
 * the items stay as they were, so nothing changes under your eyes. When
 * everything fits, it stands still and changes right away.
 */
export function StatusTicker({ statusItems, onOpen }: Props) {
  const visibleWindow = useRef<HTMLDivElement>(null);
  const belt = useRef<HTMLDivElement>(null);
  const [shownItems, setShownItems] = useState(statusItems);
  const latestItems = useRef(statusItems);
  const isScrolling = useRef(false);
  latestItems.current = statusItems;

  // Standing still: show changes right away. Scrolling: they wait for the end.
  useEffect(() => {
    if (!isScrolling.current) setShownItems(statusItems);
  }, [statusItems]);

  useEffect(() => {
    let isStopped = false;

    const slide = (fromPixels: number, toPixels: number, durationMs: number, easing: string) => {
      const beltElement = belt.current;
      if (!beltElement) return Promise.reject(new Error('The band is gone'));
      beltElement.getAnimations().forEach((animation) => animation.cancel());
      const keyframes = [{ transform: `translateX(${fromPixels}px)` }, { transform: `translateX(${toPixels}px)` }];

      return beltElement.animate(keyframes, { duration: durationMs, easing, fill: 'forwards' }).finished;
    };

    const scrollForever = async () => {
      while (!isStopped) {
        const beltElement = belt.current;
        const windowElement = visibleWindow.current;
        if (!beltElement || !windowElement) return;

        const distanceToTheEnd = beltElement.offsetWidth - windowElement.clientWidth;
        const doesEverythingFit = distanceToTheEnd <= 0;
        if (doesEverythingFit) {
          isScrolling.current = false;
          await wait(CHECK_IF_IT_FITS_MS);
          continue;
        }

        isScrolling.current = true;
        const scrollDurationMs = (distanceToTheEnd / SPEED_IN_PIXELS_PER_SECOND) * 1000;
        await slide(0, -distanceToTheEnd, scrollDurationMs, 'linear');
        await wait(REST_AT_THE_END_MS);
        if (isStopped) return;

        setShownItems(latestItems.current);
        await slide(-distanceToTheEnd, 0, BACK_TO_THE_START_MS, 'ease-in-out');
      }
    };

    // A cancelled animation (the band left the page) ends the loop.
    scrollForever().catch(() => undefined);

    return () => {
      isStopped = true;
      belt.current?.getAnimations().forEach((animation) => animation.cancel());
    };
  }, []);

  const readableStatus = shownItems.map((statusItem) => [statusItem.highlighted, statusItem.text].filter(Boolean).join(' ')).join(', ');

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
      <div ref={visibleWindow} className="status-ticker__window" aria-hidden>
        <div ref={belt} className="status-ticker__belt">
          {shownItems.map((statusItem, position) => (
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
    </div>
  );
}
