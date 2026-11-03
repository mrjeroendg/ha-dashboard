import { useEffect, useRef, type ReactNode } from 'react';
import type { Category } from '../config/categories';
import type { ResolvedRoom } from '../lib/rooms';
import { haptic } from '../lib/haptic';
import { Icon, type IconName } from './Icon';

interface Props {
  /** Left of Thuis, with a thin line between them (docs/design/nav-categories). */
  categories: Category[];
  rooms: ResolvedRoom[];
  /** null = home ("Thuis"); otherwise a category's or a room's id. */
  active: string | null;
  onSelect(pageId: string | null): void;
  /** A row on top of the rooms, part of the same bar: the media shortcuts on Thuis. */
  top?: ReactNode;
}

export function BottomNav({ categories, rooms, active, onSelect, top }: Props) {
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

  const thuisAndRooms = [{ id: null, name: 'Thuis', icon: 'home' as const }, ...rooms];
  const hasCategories = categories.length > 0;

  const renderItem = (item: { id: string | null; name: string; icon: IconName }) => (
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
  );

  return (
    <nav className="bottom-nav" aria-label="Pagina's">
      {top && <div className="bottom-nav__top">{top}</div>}
      <div className="bottom-nav__scroller" ref={scroller}>
        {categories.map(renderItem)}
        {hasCategories && <span className="bottom-nav__divider" aria-hidden />}
        {thuisAndRooms.map(renderItem)}
      </div>
    </nav>
  );
}
