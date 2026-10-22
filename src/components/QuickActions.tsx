import { SHORTCUTS } from '../config/shortcuts';
import type { HomeAssistant } from '../types/hass';
import { QuickCard } from './QuickCard';

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
          <QuickCard key={`${s.entity}-${s.label}`} shortcut={s} hass={hass} />
        ))}
      </div>
    </section>
  );
}
