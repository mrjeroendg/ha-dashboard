import type { Shortcut } from '../config/shortcuts';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  shortcut: Shortcut;
  hass: HomeAssistant;
  /** "large": Snel on Thuis (icon above label). "small": Snel in a room tab (one line). */
  size?: 'large' | 'small';
}

/** A "Snel" card: calls `<domain>.<service>` (default turn_on) on the entity. */
export function QuickCard({ shortcut, hass, size = 'large' }: Props) {
  const [status, run] = useRunAction();
  const [domain] = shortcut.entity.split('.');
  const on = hass.states[shortcut.entity]?.state === 'on';
  // Small cards light up briefly after a tap, like the cover buttons.
  const pressed = size === 'small' && (status === 'busy' || status === 'done');

  const classes = [
    'quick-card',
    size === 'small' && 'quick-card--small',
    status === 'error' && 'status-error',
    (on || pressed) && 'is-active',
  ];

  return (
    <button
      type="button"
      className={classes.filter(Boolean).join(' ')}
      onClick={() => {
        haptic('light');
        run(() =>
          hass
            .callService(domain, shortcut.service ?? 'turn_on', {}, { entity_id: shortcut.entity })
            .catch((err) => {
              haptic('failure');
              throw err;
            }),
        );
      }}
    >
      <span className="icon-tile">
        <Icon name={shortcut.icon} />
      </span>
      <span className="card-text">
        <span className="card-label">{shortcut.label}</span>
        {status === 'error' ? (
          <span className="card-detail">Dat lukte niet</span>
        ) : (
          size === 'large' && shortcut.detail && <span className="card-detail">{shortcut.detail}</span>
        )}
      </span>
    </button>
  );
}
