import { useRef, useState, type PointerEvent } from 'react';
import type { SafetyItem, SafetyLevel } from '../lib/rooms';
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

/** How far you have to drag the handle down before the sheet closes. */
const CLOSE_DISTANCE = 90;

/**
 * "Veiligheid" sheet (docs/design/room-safety): one row per door or smoke
 * detector. With problems, "Aandacht" first and then "In orde"; otherwise one
 * list in config order. Swipe the handle down or tap beside it to close.
 */
export function SafetySheet({ room, summary, level, attention, ok, items, onClose }: Props) {
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);

  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragStart.current !== null) setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    const distance = drag;
    dragStart.current = null;
    setDrag(0);
    if (distance > CLOSE_DISTANCE) onClose();
  };

  return (
    <>
      <div className="safety-backdrop" onClick={onClose} />
      <div
        className={`safety-sheet${drag ? ' is-dragging' : ''}`}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        role="dialog"
        aria-label="Veiligheid"
      >
        <div
          className="safety-sheet__grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="xp__handle" />
        </div>
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
      </div>
    </>
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
