import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { useDebouncedCommit } from '../hooks/useDebouncedCommit';
import { useRunAction } from '../hooks/useRunAction';
import {
  adjustTemperature,
  roomSummary,
  rowModel,
  setBrightness,
  setColor,
  type ColorChoice,
  type ResolvedRoom,
  type RGB,
} from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BrightnessSlider } from './BrightnessSlider';
import { ColorPicker } from './ColorPicker';
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
  const [draft, setDraft] = useDebouncedCommit<number>((pct) => setBrightness(hass, entity, pct));
  const [colorDraft, setColorDraft] = useDebouncedCommit<ColorChoice>((c) => setColor(hass, entity, c), 150);
  const busy = status === 'busy';
  const brightness = model.brightness !== undefined ? (draft ?? model.brightness) : undefined;
  const detail =
    status === 'error' ? 'Dat lukte niet' : brightness !== undefined ? `Aan · ${brightness}%` : model.detail;

  const tint = model.color ? tintFor(colorDraft, model.color.rgb) : undefined;

  const label = (
    <>
      <span className={`icon-tile${model.on ? ' is-on' : ''}`} style={tint}>
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
      <div className="row-item">
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
        {brightness !== undefined && <BrightnessSlider value={brightness} label={name} onInput={setDraft} />}
        {model.color && (
          <ColorPicker
            entityId={entity.entity_id}
            color={model.color}
            draft={colorDraft}
            label={name}
            onPick={setColorDraft}
          />
        )}
      </div>
    );
  }

  if (model.kind === 'action' && model.run) {
    const action = model.run;
    return (
      <div className={`row-item row status-${status}`}>
        {label}
        <button type="button" className="pill-button" disabled={busy} onClick={() => run(() => action(hass))}>
          {status === 'done' ? <Icon name="check" /> : model.actionLabel}
        </button>
      </div>
    );
  }

  if (model.kind === 'climate') {
    return (
      <div className={`row-item row status-${status}`}>
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

  return <div className="row-item row">{label}</div>;
}

/** Color the light's icon tile with the light's current color. */
function tintFor(draft: ColorChoice | null, current?: RGB) {
  const c = draft && 'rgb' in draft ? draft.rgb : current;
  if (!c) return undefined;
  const luminance = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  return { background: `rgb(${c.join(' ')})`, color: luminance > 0.7 ? '#1f1e1d' : '#fff' };
}
