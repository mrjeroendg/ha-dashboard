import { useEffect, useState, type CSSProperties } from 'react';
import type { WarningSheetProps } from '../../config/attention';
import { useRunAction } from '../../hooks/useRunAction';
import { BABYSIT_MARK, CATSIT_MARK, sitterAppointments, type TodoItem } from '../../lib/sitters';
import { haptic } from '../../lib/haptic';
import { EmptyState } from '../EmptyState';
import { Icon } from '../Icon';
import { Entity } from '../../config/entities';

/** "Oppas nodig" (docs/design/babysit): Marielou's babysitter, in pink. */
export function BabysitSheet({ hass, entity }: WarningSheetProps) {
  return (
    <SitterSheet
      hass={hass}
      todoListId={entity.entity_id}
      title="Oppas nodig"
      sitterMark={BABYSIT_MARK}
      refreshAutomation={Entity.SCAN_CALENDAR_FOR_BABYSITTER_AUTOMATION}
      color="#e0559b"
    />
  );
}

/** "Oppas voor Cara": the catsitter, the same sheet in violet. */
export function CatsitSheet({ hass, entity }: WarningSheetProps) {
  return (
    <SitterSheet
      hass={hass}
      todoListId={entity.entity_id}
      title="Oppas voor Cara"
      sitterMark={CATSIT_MARK}
      refreshAutomation={Entity.SCAN_CALENDAR_FOR_CATSITTER_AUTOMATION}
      color="#8f6ee0"
    />
  );
}

interface SitterSheetProps {
  hass: WarningSheetProps['hass'];
  todoListId: string;
  title: string;
  /** The mark in front of each item's title, e.g. "(BABYSIT)"; left out in the list. */
  sitterMark: RegExp;
  /** The automation that scans the calendars, run by "Bijwerken". */
  refreshAutomation: Entity;
  /** The warning's colour, for the icons and the spinner. */
  color: string;
}

/**
 * A sitter sheet (docs/design/babysit): the open items of the todo list,
 * read-only, date small on top and the title below. "Bijwerken" runs the
 * automation that scans the calendar; the list updates by itself when HA
 * reports the new items. When "Bijwerken" leaves nothing, the sheet says so
 * (docs/design/empty-state).
 */
function SitterSheet({ hass, todoListId, title, sitterMark, refreshAutomation, color }: SitterSheetProps) {
  const todoItems = useTodoItems(hass, todoListId);
  const appointments = sitterAppointments(todoItems ?? [], sitterMark);
  const hasLoadedWithoutAppointments = todoItems !== undefined && appointments.length === 0;

  return (
    <div className="sitter-sheet" style={{ '--sitter-color': color } as CSSProperties}>
      <div className="sitter-sheet__header">
        <h2 className="sitter-sheet__title">{title}</h2>
        <RefreshButton hass={hass} refreshAutomation={refreshAutomation} />
      </div>
      {hasLoadedWithoutAppointments && <EmptyState icon="check" text="Geen afspraken meer" />}
      <ul className="sitter-list">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="sitter-list__row">
            <span className="sitter-list__icon">
              <Icon name="calendar" />
            </span>
            <span className="sitter-list__text">
              {appointment.dateText && <span className="sitter-list__date">{appointment.dateText}</span>}
              <span className="sitter-list__title">{appointment.title}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The todo list's items, kept up to date by HA (todo/item/subscribe); undefined until HA first answers. */
function useTodoItems(hass: WarningSheetProps['hass'], todoListId: string): TodoItem[] | undefined {
  const [todoItems, setTodoItems] = useState<TodoItem[] | undefined>(undefined);

  useEffect(() => {
    const connection = hass.connection;
    // Without a live connection (dev mock), fetch the list once.
    if (!connection) {
      hass
        .callWS<{ items: TodoItem[] }>({ type: 'todo/item/list', entity_id: todoListId })
        .then((response) => setTodoItems(response.items))
        .catch((error) => console.error(error));
      return;
    }
    const unsubscribe = connection.subscribeMessage<{ items: TodoItem[] }>((update) => setTodoItems(update.items), {
      type: 'todo/item/subscribe',
      entity_id: todoListId,
    });
    return () => {
      unsubscribe.then((stopListening) => stopListening()).catch(() => undefined);
    };
    // Subscribe once per list; hass changes on every state update.
  }, [todoListId]);

  return todoItems;
}

/** Runs the calendar scan: "Bijwerken", spinner while it runs, then "Bijgewerkt" or "Dat lukte niet". */
function RefreshButton({ hass, refreshAutomation }: { hass: WarningSheetProps['hass']; refreshAutomation: Entity }) {
  const [refreshStatus, runRefresh] = useRunAction();
  const isRefreshing = refreshStatus === 'busy';

  const refreshText = {
    idle: 'Bijwerken',
    busy: 'Bijwerken…',
    done: 'Bijgewerkt',
    error: 'Dat lukte niet',
  }[refreshStatus];

  return (
    <button
      type="button"
      className={`sitter-refresh status-${refreshStatus}`}
      disabled={isRefreshing}
      onClick={() => {
        haptic('light');
        runRefresh(() => hass.callService('automation', 'trigger', {}, { entity_id: refreshAutomation }));
      }}
    >
      {isRefreshing ? <span className="spinner" aria-hidden /> : <Icon name={refreshStatus === 'done' ? 'check' : 'refresh'} />}
      {refreshText}
    </button>
  );
}
