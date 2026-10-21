import { useEffect, useRef } from 'react';
import type { ResolvedRoom } from '../lib/rooms';
import { haptic } from '../lib/haptic';
import { Icon } from './Icon';

interface Props {
  rooms: ResolvedRoom[];
  /** null = home ("Thuis") */
  active: string | null;
  onSelect(roomId: string | null): void;
}

export function BottomNav({ rooms, active, onSelect }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  // Keep the active pill in view when the bar scrolls sideways.
  // Only scroll the bar itself sideways. (scrollIntoView would also scroll the
  // page vertically on iOS, which made the dashboard jump.)
  useEffect(() => {
    const bar = scroller.current;
    const pill = bar?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!bar || !pill) return;
    const left = pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active]);

  const items = [{ id: null, name: 'Thuis', icon: 'home' as const }, ...rooms];

  return (
    <nav className="bottom-nav" aria-label="Kamers">
      <div className="bottom-nav__scroller" ref={scroller}>
        {items.map((item) => (
          <button
            key={item.id ?? 'home'}
            type="button"
            className="bottom-nav__item"
            aria-current={item.id === active ? 'page' : undefined}
            onClick={() => {
              haptic('selection');
              onSelect(item.id);
            }}
          >
            <Icon name={item.icon} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
