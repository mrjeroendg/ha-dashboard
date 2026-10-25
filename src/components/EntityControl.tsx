import type { HassEntity } from 'home-assistant-js-websocket';
import { useState, type ReactNode } from 'react';
import { useDebouncedCommit } from '../hooks/useDebouncedCommit';
import { useRunAction, type RunStatus } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import {
  rowModel,
  setBrightness,
  setColor,
  type ColorChoice,
  type LightMember,
  turnOnLight,
  type RowOptions,
  type RGB,
} from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { AircoSheet } from './AircoSheet';
import { BrightnessSlider } from './BrightnessSlider';
import { ColorPicker } from './ColorPicker';
import { Icon, type IconName } from './Icon';
import { LightSheet } from './LightSheet';

interface Props {
  entity: HassEntity;
  name: string;
  options?: RowOptions;
  myPosition?: string;
  members?: LightMember[];
  hass: HomeAssistant;
  /** Overrides the icon that goes with the entity's domain, e.g. a shortcut's own icon. */
  icon?: IconName;
  /**
   * 'slim' (docs/design/snel-list): smaller, and no second line except
   * "Dat lukte niet". Only the look changes; tapping behaves the same.
   */
  look?: 'slim';
}

/**
 * One entity as a control, as in a room and in Snel: what it looks like and
 * what a tap does follows from its domain (`rowModel`). A switch for lights and
 * switches (with the light sheet for a light with members, or its slider and
 * colours), "Start" for scenes and scripts, the strip for covers, the airco sheet.
 */
export function EntityControl({ entity, name, options = {}, myPosition, members, hass, icon, look }: Props) {
  const model = rowModel(entity, options);
  const [status, run] = useRunAction();
  const [brightnessDraft, setBrightnessDraft] = useDebouncedCommit<number>((draggedBrightness) =>
    setBrightness(hass, entity, draggedBrightness),
  );
  const [colorDraft, setColorDraft] = useDebouncedCommit<ColorChoice>((chosenColor) => setColor(hass, entity, chosenColor), 150);
  const isBusy = status === 'busy';
  const isSlim = look === 'slim';
  const brightness = model.brightness !== undefined ? (brightnessDraft ?? model.brightness) : undefined;
  const detailWhileOn =
    brightness !== undefined
      ? ['Aan', `${brightness}%`, model.kelvin !== undefined && `${model.kelvin} K`].filter(Boolean).join(' · ')
      : model.detail;
  const detail = status === 'error' ? 'Dat lukte niet' : isSlim ? undefined : detailWhileOn;

  const tint = model.color ? tintFor(colorDraft, model.color.rgb) : undefined;

  const label = (
    <>
      <span className={`icon-tile${model.on ? ' is-on' : ''}`} style={tint}>
        <Icon name={icon ?? model.icon} />
      </span>
      <span className="card-text">
        <span className="row__name">{name}</span>
        {detail && <span className={`card-detail${status === 'error' ? ' is-error' : ''}`}>{detail}</span>}
      </span>
    </>
  );

  if (model.kind === 'toggle' && model.run && members?.length) {
    return (
      <SheetRow
        hass={hass}
        light={entity}
        name={name}
        label={label}
        on={model.on}
        toggle={model.run}
        members={members}
        status={status}
        run={run}
      />
    );
  }

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
        {brightness !== undefined && <BrightnessSlider value={brightness} label={name} onInput={setBrightnessDraft} />}
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
    const coverEntityId = entity.entity_id;
    const cover = (service: string) => () => hass.callService('cover', service, {}, { entity_id: coverEntityId });
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
        <button type="button" className="pill-button" disabled={isBusy} onClick={() => run(() => action(hass))}>
          {status === 'done' ? <Icon name="check" /> : model.actionLabel}
        </button>
      </div>
    );
  }

  if (model.kind === 'climate' && model.run) {
    return <AircoRow hass={hass} airco={entity} name={name} label={label} on={model.on} toggle={model.run} status={status} run={run} />;
  }

  return <div className="row-item row">{label}</div>;
}

interface SheetRowProps {
  hass: HomeAssistant;
  light: HassEntity;
  name: string;
  label: ReactNode;
  on: boolean;
  toggle(hass: HomeAssistant): Promise<unknown>;
  members: LightMember[];
  status: RunStatus;
  run(action: () => Promise<unknown>): void;
}

/**
 * A light with `members` (docs/design/light-sheet): only the switch turns it
 * on and off; the rest of the row opens the light sheet. An off light is
 * turned on first, so every control in the sheet starts from a lit lamp.
 */
function SheetRow({ hass, light, name, label, on, toggle, members, status, run }: SheetRowProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openSheet = () => {
    haptic('selection');
    if (on) {
      setIsSheetOpen(true);
      return;
    }
    run(async () => {
      await turnOnLight(hass, light);
      setIsSheetOpen(true);
    });
  };

  return (
    <RowWithSheet name={name} label={label} on={on} status={status} onOpen={openSheet} onToggle={() => run(() => toggle(hass))}>
      {isSheetOpen && <LightSheet hass={hass} name={name} members={members} onClose={() => setIsSheetOpen(false)} />}
    </RowWithSheet>
  );
}

interface AircoRowProps {
  hass: HomeAssistant;
  airco: HassEntity;
  name: string;
  label: ReactNode;
  on: boolean;
  toggle(hass: HomeAssistant): Promise<unknown>;
  status: RunStatus;
  run(action: () => Promise<unknown>): void;
}

/**
 * An airco (docs/design/airco-sheet): the switch turns it off from any mode, or
 * back on; the rest of the row opens the airco sheet, without turning it on.
 */
function AircoRow({ hass, airco, name, label, on, toggle, status, run }: AircoRowProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openSheet = () => {
    haptic('selection');
    setIsSheetOpen(true);
  };

  return (
    <RowWithSheet name={name} label={label} on={on} status={status} onOpen={openSheet} onToggle={() => run(() => toggle(hass))}>
      {isSheetOpen && <AircoSheet hass={hass} airco={airco} name={name} onClose={() => setIsSheetOpen(false)} />}
    </RowWithSheet>
  );
}

interface RowWithSheetProps {
  name: string;
  label: ReactNode;
  on: boolean;
  status: RunStatus;
  onOpen(): void;
  onToggle(): void;
  /** The sheet, while it's open. */
  children: ReactNode;
}

/** A row whose left part opens a sheet; only the switch on the right turns it on and off. */
function RowWithSheet({ name, label, on, status, onOpen, onToggle, children }: RowWithSheetProps) {
  return (
    <div className="row-item">
      <div className={`row row--sheet status-${status}`}>
        <button type="button" className="row__open" onClick={onOpen}>
          {label}
        </button>
        {/* docs/design/light-sheet: the divider shows the left part does something else than the switch. */}
        <span className="row__divider" aria-hidden />
        <button type="button" className="row__switch" role="switch" aria-checked={on} aria-label={name} onClick={onToggle}>
          <span className={`switch${on ? ' is-on' : ''}`} aria-hidden />
        </button>
      </div>
      {children}
    </div>
  );
}

/** One button of a cover's strip: lights up briefly after a tap, nothing stays selected. */
function CoverButton({ icon, label, action }: { icon: IconName; label: string; action: () => Promise<unknown> }) {
  const [status, run] = useRunAction();
  const isPressed = status === 'busy' || status === 'done';
  return (
    <button
      type="button"
      className={`cover-strip__button${isPressed ? ' is-pressed' : ''}${status === 'error' ? ' is-error' : ''}${icon === 'star' ? ' is-preset' : ''}`}
      aria-label={label}
      onClick={() => {
        haptic('light');
        run(() =>
          action().catch((error) => {
            haptic('failure');
            throw error;
          }),
        );
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

/** Color the light's icon tile with the light's current color. */
function tintFor(colorDraft: ColorChoice | null, colorFromEntity?: RGB) {
  const shownColor = colorDraft && 'rgb' in colorDraft ? colorDraft.rgb : colorFromEntity;
  if (!shownColor) return undefined;

  const [red, green, blue] = shownColor;
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  const isLightColor = luminance > 0.7;

  return { background: `rgb(${shownColor.join(' ')})`, color: isLightColor ? '#1f1e1d' : '#fff' };
}
