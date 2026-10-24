import { useEffect, useState } from 'react';
import type { WarningSheetProps } from '../../config/attention';
import { BABYSIT } from '../../config/babysit';
import { useRunAction } from '../../hooks/useRunAction';
import { babysitAppointments, type TodoItem } from '../../lib/babysit';
import { haptic } from '../../lib/haptic';
import { Icon } from '../Icon';

/**
 * "Oppas nodig" (docs/design/babysit): the open items of the babysit todo
 * list, read-only, date small on top and the title below. "Bijwerken" runs
 * the automation that scans the calendar; the list updates by itself when HA
 * reports the new items.
 */
export function BabysitSheet({ hass, entity }: WarningSheetProps) {
  const todoItems = useTodoItems(hass, entity.entity_id);
  const appointments = babysitAppointments(todoItems);

  return (
    <>
      <div className="babysit-sheet__header">
        <h2 className="babysit-sheet__title">Oppas nodig</h2>
        <RefreshButton hass={hass} />
      </div>
      <ul className="babysit-list">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="babysit-list__row">
            <span className="babysit-list__icon">
              <Icon name="calendar" />
            </span>
            <span className="babysit-list__text">
              {appointment.dateText && <span className="babysit-list__date">{appointment.dateText}</span>}
              <span className="babysit-list__title">{appointment.title}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The todo list's items, kept up to date by HA (todo/item/subscribe). */
function useTodoItems(hass: WarningSheetProps['hass'], todoListId: string): TodoItem[] {
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

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
function RefreshButton({ hass }: Pick<WarningSheetProps, 'hass'>) {
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
      className={`babysit-refresh status-${refreshStatus}`}
      disabled={isRefreshing}
      onClick={() => {
        haptic('light');
        runRefresh(() => hass.callService('automation', 'trigger', {}, { entity_id: 'automation.scan_google_calendar_for_babysit_requirements' }));
      }}
    >
      {isRefreshing ? <span className="spinner" aria-hidden /> : <Icon name={refreshStatus === 'done' ? 'check' : 'refresh'} />}
      {refreshText}
    </button>
  );
}
