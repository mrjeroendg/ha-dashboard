import type { SafetyItem, SafetyLevel } from '../lib/rooms';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

interface Props {
  room: string;
  summary: string;
  level?: SafetyLevel;
  attention: SafetyItem[];
  ok: SafetyItem[];
  items: SafetyItem[];
  onClose(): void;
}

/**
 * "Veiligheid" sheet (docs/design/room-safety): one row per door or smoke
 * detector. With problems, "Aandacht" first and then "In orde"; otherwise one
 * list in config order. Swipe the handle down or tap beside it to close.
 */
export function SafetySheet({ room, summary, level, attention, ok, items, onClose }: Props) {
  return (
    <BottomSheet label="Veiligheid" className="safety-sheet" onClose={onClose}>
      <h2 className="safety-sheet__title">Veiligheid</h2>
      <p className="safety-sheet__sub">
        <span className={`safety-dot${level ? ` is-${level}` : ''}`} aria-hidden />
        {room} · {summary}
      </p>
      {attention.length > 0 ? (
        <>
          <h3 className="safety-sheet__section">Aandacht</h3>
          <SafetyList items={attention} />
          {ok.length > 0 && (
            <>
              <h3 className="safety-sheet__section">In orde</h3>
              <SafetyList items={ok} />
            </>
          )}
        </>
      ) : (
        <SafetyList items={items} />
      )}
    </BottomSheet>
  );
}

function SafetyList({ items }: { items: SafetyItem[] }) {
  return (
    <ul className="safety-list">
      {items.map((item) => (
        <li key={item.id} className="safety-list__row">
          <Icon name={item.icon} />
          <span className="safety-list__name">{item.name}</span>
          <span className={`safety-list__state${item.level ? ` is-${item.level}` : ''}`}>
            {item.level && <span className={`safety-dot is-${item.level}`} aria-hidden />}
            {item.state}
          </span>
        </li>
      ))}
    </ul>
  );
}
