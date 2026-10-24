import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useRef, type ReactNode } from 'react';
import { useControlValue } from '../hooks/useControlValue';
import {
  availableAircoModes,
  currentTemperatureDetail,
  readableTemperature,
  setAircoMode,
  setTargetTemperature,
  targetTemperature,
  temperatureRange,
} from '../lib/airco';
import { haptic } from '../lib/haptic';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
  airco: HassEntity;
  name: string;
  onClose(): void;
}

/** How long after the last − / + tap the target is sent, so a few quick taps make one call. */
const SEND_TARGET_AFTER_MILLISECONDS = 700;

/**
 * Airco sheet (docs/design/airco-sheet, option A): the target temperature, then
 * a row of icons per setting. Everything on one sheet, no swiping.
 */
export function AircoSheet({ hass, airco, name, onClose }: Props) {
  return (
    <BottomSheet
      label={name}
      className="airco-sheet"
      besideHandle={<span className="airco-sheet__name">{name}</span>}
      onClose={onClose}
    >
      <TargetTemperature hass={hass} airco={airco} />
      <ModeChoice hass={hass} airco={airco} />
    </BottomSheet>
  );
}

function TargetTemperature({ hass, airco }: { hass: HomeAssistant; airco: HassEntity }) {
  const { step, min, max } = temperatureRange(airco);
  const targetControl = useControlValue(targetTemperature(airco), (targetFromEntity, targetInApp) => targetFromEntity === targetInApp);
  const targetInApp = targetControl.currentValueInApp;
  const sendTimer = useRef<number | undefined>(undefined);
  const targetWaitingToBeSent = useRef<number | undefined>(undefined);

  const sendTarget = () => {
    const target = targetWaitingToBeSent.current;
    targetWaitingToBeSent.current = undefined;
    if (target === undefined) return;

    targetControl.keepAfterRelease(target);
    setTargetTemperature(hass, airco, target).catch((error) => {
      console.error(error);
      targetControl.showValueFromEntity();
    });
  };

  // Closing the sheet right after a tap still sends it.
  useEffect(() => () => {
    window.clearTimeout(sendTimer.current);
    sendTarget();
  }, []);

  // Modes without a target (e.g. drying): only the current temperature.
  if (targetInApp === undefined) {
    return <p className="airco-sheet__now airco-sheet__now--alone">{currentTemperatureDetail(airco)}</p>;
  }

  const changeTargetBy = (direction: 1 | -1) => {
    const targetOnStep = Math.round((targetInApp + direction * step) / step) * step;
    const newTarget = Math.min(max, Math.max(min, targetOnStep));
    if (newTarget === targetInApp) return;

    haptic('light');
    targetControl.showWhileDragging(newTarget);
    targetWaitingToBeSent.current = newTarget;
    window.clearTimeout(sendTimer.current);
    sendTimer.current = window.setTimeout(sendTarget, SEND_TARGET_AFTER_MILLISECONDS);
  };

  return (
    <div className="airco-sheet__target">
      <div className="airco-target">
        <button
          type="button"
          className="airco-target__step"
          aria-label="Kouder"
          disabled={targetInApp <= min}
          onClick={() => changeTargetBy(-1)}
        >
          <Icon name="minus" />
        </button>
        <span className="airco-target__value" aria-live="polite">
          {readableTemperature(targetInApp)}°
        </span>
        <button
          type="button"
          className="airco-target__step"
          aria-label="Warmer"
          disabled={targetInApp >= max}
          onClick={() => changeTargetBy(1)}
        >
          <Icon name="plus" />
        </button>
      </div>
      <p className="airco-sheet__now">{currentTemperatureDetail(airco)}</p>
    </div>
  );
}

function ModeChoice({ hass, airco }: { hass: HomeAssistant; airco: HassEntity }) {
  const modes = availableAircoModes(airco);
  const modeControl = useControlValue<string>(airco.state, (modeFromEntity, modeInApp) => modeFromEntity === modeInApp);
  const modeInApp = modeControl.currentValueInApp;

  const chooseMode = (chosenMode: string) => {
    modeControl.keepAfterRelease(chosenMode);
    setAircoMode(hass, airco, chosenMode).catch((error) => {
      console.error(error);
      modeControl.showValueFromEntity();
    });
  };

  return (
    <IconChoice
      title="Modus"
      options={modes.map((aircoMode) => ({ value: aircoMode.mode, name: aircoMode.name, icon: <Icon name={aircoMode.icon} /> }))}
      chosenValue={modeInApp}
      onChoose={chooseMode}
      look="modes"
    />
  );
}

interface IconOption {
  /** What HA calls it, e.g. "heat" or "3". */
  value: string;
  /** Shown above the row when chosen, and read out by screen readers. */
  name: string;
  icon: ReactNode;
}

interface IconChoiceProps {
  title: string;
  options: IconOption[];
  chosenValue?: string;
  onChoose(value: string): void;
  /** The mode row has slightly taller buttons. */
  look?: 'modes';
}

/** A row of icons, one per option; the chosen one is filled. Hidden when there's nothing to choose. */
function IconChoice({ title, options, chosenValue, onChoose, look }: IconChoiceProps) {
  if (options.length === 0) return null;

  const chosenOption = options.find((option) => option.value === chosenValue);

  return (
    <div className="airco-choice">
      <p className="airco-choice__title">
        {title}
        {chosenOption && <span className="airco-choice__chosen">{chosenOption.name}</span>}
      </p>
      <div className={`airco-choice__options${look === 'modes' ? ' airco-choice__options--modes' : ''}`} role="group" aria-label={title}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="airco-choice__option"
            aria-label={option.name}
            aria-pressed={option.value === chosenValue}
            onClick={() => {
              if (option.value === chosenValue) return;
              haptic('selection');
              onChoose(option.value);
            }}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
