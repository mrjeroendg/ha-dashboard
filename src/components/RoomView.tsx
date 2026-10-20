import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { useRunAction } from '../hooks/useRunAction';
import { adjustTemperature, roomSummary, rowModel, type ResolvedRoom } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  room: ResolvedRoom;
  hass: HomeAssistant;
  states: HassEntities;
}

export function RoomView({ room, hass, states }: Props) {
  return (
    <>
      <header className="header">
        <p className="header__date">Kamer</p>
        <h1 className="header__greeting">{room.name}</h1>
        <p className="room-summary">{roomSummary(room, states)}</p>
      </header>
      <section className="row-group">
        {room.rows.map((row) => (
          <EntityRow key={row.entity.entity_id} entity={row.entity} name={row.name} hass={hass} />
        ))}
      </section>
    </>
  );
}

interface RowProps {
  entity: HassEntity;
  name: string;
  hass: HomeAssistant;
}

function EntityRow({ entity, name, hass }: RowProps) {
  const model = rowModel(entity);
  const [status, run] = useRunAction();
  const busy = status === 'busy';
  const detail = status === 'error' ? 'Dat lukte niet' : model.detail;

  const label = (
    <>
      <span className={`icon-tile${model.on ? ' is-on' : ''}`}>
        <Icon name={model.icon} />
      </span>
      <span className="card-text">
        <span className="row__name">{name}</span>
        <span className={`card-detail${status === 'error' ? ' is-error' : ''}`}>{detail}</span>
      </span>
    </>
  );

  if (model.kind === 'toggle' && model.run) {
    const toggle = model.run;
    return (
      <button
        type="button"
        className={`row status-${status}`}
        role="switch"
        aria-checked={model.on}
        onClick={() => run(() => toggle(hass))}
      >
        {label}
        <span className={`switch${model.on ? ' is-on' : ''}`} aria-hidden />
      </button>
    );
  }

  if (model.kind === 'action' && model.run) {
    const action = model.run;
    return (
      <div className={`row status-${status}`}>
        {label}
        <button type="button" className="pill-button" disabled={busy} onClick={() => run(() => action(hass))}>
          {status === 'done' ? <Icon name="check" /> : model.actionLabel}
        </button>
      </div>
    );
  }

  if (model.kind === 'climate') {
    return (
      <div className={`row status-${status}`}>
        {label}
        <span className="stepper">
          <button type="button" aria-label="Kouder" disabled={busy} onClick={() => run(() => adjustTemperature(hass, entity, -0.5))}>
            <Icon name="minus" />
          </button>
          <button type="button" aria-label="Warmer" disabled={busy} onClick={() => run(() => adjustTemperature(hass, entity, 0.5))}>
            <Icon name="plus" />
          </button>
        </span>
      </div>
    );
  }

  return <div className="row">{label}</div>;
}
