import { SHORTCUTS } from '../config/shortcuts';
import { resolveRows } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { EntityControl } from './EntityControl';

interface Props {
  hass: HomeAssistant;
}

/**
 * "Snel" on Thuis (docs/design/snel-list): the shortcuts from
 * src/config/shortcuts.ts as one slim list, in order. Configured like the
 * controls in a room and resolved the same way, so each one behaves exactly
 * like one: same control, same light sheet for a light with members.
 */
export function QuickActions({ hass }: Props) {
  const shortcutRows = resolveRows(SHORTCUTS, hass.states);
  if (shortcutRows.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">Snel</h2>
      <div className="row-group row-group--slim">
        {shortcutRows.map((shortcutRow) => (
          <EntityControl
            key={shortcutRow.entity.entity_id}
            entity={shortcutRow.entity}
            name={shortcutRow.name}
            icon={shortcutRow.icon}
            options={{ allowUnknownState: shortcutRow.allowUnknownState, simple: shortcutRow.simple }}
            myPosition={shortcutRow.myPosition}
            members={shortcutRow.members}
            look="slim"
            hass={hass}
          />
        ))}
      </div>
    </section>
  );
}
