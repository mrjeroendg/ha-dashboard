import { SHORTCUTS } from '../config/shortcuts';
import type { HomeAssistant } from '../types/hass';
import { EntityControl } from './EntityControl';

interface Props {
  hass: HomeAssistant;
}

/**
 * "Snel" on Thuis (docs/design/snel-list): the shortcuts from
 * src/config/shortcuts.ts as one slim list, in order. Each one is the same
 * control as in a room, with the shortcut's own name and icon. Its config is
 * separate from the rooms: nothing is looked up there.
 */
export function QuickActions({ hass }: Props) {
  const shortcutsThatExist = SHORTCUTS.filter((shortcut) => shortcut.entity in hass.states);
  if (shortcutsThatExist.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">Snel</h2>
      <div className="row-group row-group--slim">
        {shortcutsThatExist.map((shortcut) => (
          <EntityControl
            key={shortcut.entity}
            entity={hass.states[shortcut.entity]}
            name={shortcut.label}
            icon={shortcut.icon}
            look="slim"
            hass={hass}
          />
        ))}
      </div>
    </section>
  );
}
