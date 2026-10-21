import { SHORTCUTS, type Shortcut } from '../config/shortcuts';
import { useRunAction, type RunStatus } from '../hooks/useRunAction';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
}

/** "Snel" on Thuis: the shortcuts from src/config/shortcuts.ts, in order. */
export function QuickActions({ hass }: Props) {
  if (SHORTCUTS.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">Snel</h2>
      <div className="quick-grid">
        {SHORTCUTS.map((s) => (
          <ShortcutCard key={`${s.entity}-${s.label}`} shortcut={s} hass={hass} />
        ))}
      </div>
    </section>
  );
}

function ShortcutCard({ shortcut, hass }: { shortcut: Shortcut; hass: HomeAssistant }) {
  const [status, run] = useRunAction();
  const [domain] = shortcut.entity.split('.');
  const on = hass.states[shortcut.entity]?.state === 'on';

  return (
    <button
      type="button"
      className={`quick-card status-${status}${on ? ' is-active' : ''}`}
      onClick={() =>
        run(() => hass.callService(domain, shortcut.service ?? 'turn_on', {}, { entity_id: shortcut.entity }))
      }
    >
      <span className="icon-tile">
        <Icon name={shortcut.icon} />
      </span>
      {status === 'done' && (
        <span className="quick-card__check">
          <Icon name="check" />
        </span>
      )}
      <span className="card-text">
        <span className="card-label">{shortcut.label}</span>
        {(statusText(status) ?? shortcut.detail) && (
          <span className="card-detail">{statusText(status) ?? shortcut.detail}</span>
        )}
      </span>
    </button>
  );
}

function statusText(status: RunStatus): string | undefined {
  if (status === 'busy') return 'Bezig…';
  if (status === 'error') return 'Dat lukte niet';
  return undefined;
}
