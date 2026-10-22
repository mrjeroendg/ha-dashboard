import type { HassEntity } from 'home-assistant-js-websocket';
import { useState, type CSSProperties } from 'react';
import { useDebouncedCommit } from '../hooks/useDebouncedCommit';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import {
  adjustTemperature,
  roomClimate,
  rowModel,
  setBrightness,
  setColor,
  type ColorChoice,
  type ResolvedRoom,
  type RowOptions,
  type RGB,
} from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BrightnessSlider } from './BrightnessSlider';
import { ColorPicker } from './ColorPicker';
import { Icon, type IconName } from './Icon';
import { QuickCard } from './QuickCard';

interface Props {
  room: ResolvedRoom;
  hass: HomeAssistant;
}

export function RoomView({ room, hass }: Props) {
  // Always starts on the first tab: the page remounts for every room.
  const [tab, setTab] = useState(0);
  const sections = room.sections;
  const section = sections[Math.min(tab, sections.length - 1)];
  const tabs = sections.length > 1;
  const climate = roomClimate(room, hass.states);

  return (
    <>
      <header className="header">
        <p className="header__date">Kamer</p>
        <div className="room-header">
          <h1 className="header__greeting">{room.name}</h1>
          {climate && (
            <div className="room-header__climate">
              <span className="room-header__value">{climate.value}</span>
              {climate.label && <span className="room-header__label">{climate.label}</span>}
            </div>
          )}
        </div>
      </header>
      {tabs && (
        <div className="room-tabs" role="tablist">
          {sections.map((s, i) => (
            <button
              key={s.title ?? i}
              type="button"
              role="tab"
              className="room-tab"
              aria-selected={s === section}
              onClick={() => {
                haptic('selection');
                setTab(i);
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
      {section.shortcuts.length > 0 && (
        <>
          <h2 className="section-title section-title--tab">Snel</h2>
          <div className="quick-row" style={{ '--n': section.shortcuts.length } as CSSProperties}>
            {section.shortcuts.map((s) => (
              <QuickCard key={`${s.entity}-${s.label}`} shortcut={s} hass={hass} size="small" />
            ))}
          </div>
        </>
      )}
      {section.rows.length > 0 && (
        <section className={`row-group${tabs ? ' row-group--tabbed' : ''}`}>
          {section.rows.map((row) => (
            <EntityRow
              key={row.entity.entity_id}
              entity={row.entity}
              name={row.name}
              options={{ allowUnknownState: row.allowUnknownState, simple: row.simple }}
              myPosition={row.myPosition}
              hass={hass}
            />
          ))}
        </section>
      )}
    </>
  );
}

interface RowProps {
  entity: HassEntity;
  name: string;
  options: RowOptions;
  myPosition?: string;
  hass: HomeAssistant;
}

function EntityRow({ entity, name, options, myPosition, hass }: RowProps) {
  const model = rowModel(entity, options);
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
        {detail && <span className={`card-detail${status === 'error' ? ' is-error' : ''}`}>{detail}</span>}
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

  if (model.kind === 'cover' && model.cover) {
    const id = entity.entity_id;
    const cover = (service: string) => () => hass.callService('cover', service, {}, { entity_id: id });
    const buttons: Array<[IconName, string, () => Promise<unknown>, boolean]> = [
      ['up', 'Omhoog', cover('open_cover'), model.cover.open],
      ['star', 'Mijn positie', () => hass.callService('button', 'press', {}, { entity_id: myPosition }), !!myPosition],
      ['stop', 'Stop', cover('stop_cover'), model.cover.stop],
      ['down', 'Omlaag', cover('close_cover'), model.cover.close],
    ];
    return (
      <div className="row-item">
        <div className="row">{label}</div>
        <div className="cover-strip">
          {buttons
            .filter(([, , , shown]) => shown)
            .map(([icon, text, action]) => (
              <CoverButton key={icon} icon={icon} label={`${name}: ${text}`} action={action} />
            ))}
        </div>
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

/** One button of a cover's strip: lights up briefly after a tap, nothing stays selected. */
function CoverButton({ icon, label, action }: { icon: IconName; label: string; action: () => Promise<unknown> }) {
  const [status, run] = useRunAction();
  const pressed = status === 'busy' || status === 'done';
  return (
    <button
      type="button"
      className={`cover-strip__button${pressed ? ' is-pressed' : ''}${status === 'error' ? ' is-error' : ''}${icon === 'star' ? ' is-preset' : ''}`}
      aria-label={label}
      onClick={() => {
        haptic('light');
        run(() =>
          action().catch((err) => {
            haptic('failure');
            throw err;
          }),
        );
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

/** Color the light's icon tile with the light's current color. */
function tintFor(draft: ColorChoice | null, current?: RGB) {
  const c = draft && 'rgb' in draft ? draft.rgb : current;
  if (!c) return undefined;
  const luminance = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  return { background: `rgb(${c.join(' ')})`, color: luminance > 0.7 ? '#1f1e1d' : '#fff' };
}
