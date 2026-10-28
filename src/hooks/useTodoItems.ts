import { useEffect, useState } from 'react';
import type { HomeAssistant, TodoItem } from '../types/hass';

/**
 * A todo list's items, kept up to date by HA (todo/item/subscribe); undefined
 * until HA first answers, and while there's no `hass` or no such list in HA.
 */
export function useTodoItems(hass: HomeAssistant | undefined, todoListId: string): TodoItem[] | undefined {
  const [todoItems, setTodoItems] = useState<TodoItem[] | undefined>(undefined);
  const doesListExist = hass?.states[todoListId] !== undefined;

  useEffect(() => {
    if (!hass || !doesListExist) return;

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
  }, [todoListId, doesListExist]);

  return todoItems;
}
