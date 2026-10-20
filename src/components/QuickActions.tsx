import { useMemo } from 'react';
import { useNow } from '../hooks/useNow';
import { useRunAction, type RunStatus } from '../hooks/useRunAction';
import { buildContext, selectQuickActions, type ActionContext, type QuickAction } from '../lib/quickActions';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
}

export function QuickActions({ hass }: Props) {
  const now = useNow();
  const ctx = useMemo(() => buildContext(now, hass.states), [now, hass.states]);
  const { suggested, quick } = useMemo(() => selectQuickActions(ctx), [ctx]);

  return (
    <>
      {suggested && (
        <section>
          <h2 className="section-title">Voorgesteld</h2>
          <SuggestedCard action={suggested} hass={hass} ctx={ctx} />
        </section>
      )}
      {quick.length > 0 && (
        <section>
          <h2 className="section-title">Snel</h2>
          <div className="quick-grid">
            {quick.map((a) => (
              <QuickCard key={a.id} action={a} hass={hass} ctx={ctx} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

interface CardProps {
  action: QuickAction;
  hass: HomeAssistant;
  ctx: ActionContext;
}

function SuggestedCard({ action, hass, ctx }: CardProps) {
  const [status, run] = useRunAction();
  return (
    <button
      type="button"
      className={`suggested status-${status}`}
      onClick={() => run(() => action.run(hass, ctx))}
    >
      <span className="icon-tile">
        <Icon name={action.icon} />
      </span>
      <span className="card-text">
        <span className="card-label">{action.label}</span>
        <span className="card-detail">{statusText(status) ?? action.detail(ctx)}</span>
      </span>
      <span className="suggested__end">
        <Icon name={status === 'done' ? 'check' : 'chevron'} />
      </span>
    </button>
  );
}

function QuickCard({ action, hass, ctx }: CardProps) {
  const [status, run] = useRunAction();
  const classes = [
    'quick-card',
    `status-${status}`,
    action.active?.(ctx) && 'is-active',
    action.warning && 'is-warning',
  ].filter(Boolean);

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={() => run(() => action.run(hass, ctx))}
    >
      <span className="icon-tile">
        <Icon name={action.warning ? 'alert' : action.icon} />
      </span>
      {status === 'done' && (
        <span className="quick-card__check">
          <Icon name="check" />
        </span>
      )}
      <span className="card-text">
        <span className="card-label">{action.label}</span>
        <span className="card-detail">{statusText(status) ?? action.detail(ctx)}</span>
      </span>
    </button>
  );
}

function statusText(status: RunStatus): string | undefined {
  if (status === 'busy') return 'Bezig…';
  if (status === 'error') return 'Dat lukte niet';
  return undefined;
}
