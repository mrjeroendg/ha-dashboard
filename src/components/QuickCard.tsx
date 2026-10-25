import type { Shortcut } from '../config/shortcuts';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  shortcut: Shortcut;
  hass: HomeAssistant;
}

/**
 * A "Snel" card in a room tab (docs/design/screens-snel): icon and label on one
 * line, calls `<domain>.<service>` (default turn_on) on the entity. Snel on
 * Thuis is a list of `EntityControl`s instead (docs/design/snel-list).
 */
export function QuickCard({ shortcut, hass }: Props) {
  const [status, run] = useRunAction();
  const [domain] = shortcut.entity.split('.');
  const isOn = hass.states[shortcut.entity]?.state === 'on';
  // Lights up briefly after a tap, like the cover buttons.
  const isPressed = status === 'busy' || status === 'done';

  const classes = ['quick-card', 'quick-card--small', status === 'error' && 'status-error', (isOn || isPressed) && 'is-active'];

  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      onClick={() => {
        haptic('light');
        run(() =>
          hass
            .callService(domain, shortcut.service ?? 'turn_on', {}, { entity_id: shortcut.entity })
            .catch((error) => {
              haptic('failure');
              throw error;
            }),
        );
      }}
    >
      <span className="icon-tile">
        <Icon name={shortcut.icon} />
      </span>
      <span className="card-text">
        <span className="card-label">{shortcut.label}</span>
        {status === 'error' && <span className="card-detail">Dat lukte niet</span>}
      </span>
    </button>
  );
}
