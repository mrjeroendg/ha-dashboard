import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useRef } from 'react';
import { useControlValue } from '../hooks/useControlValue';
import {
  aircoSettings,
  currentTemperatureDetail,
  readableTemperature,
  setTargetTemperature,
  targetTemperature,
  temperatureRange,
} from '../lib/airco';
import { haptic } from '../lib/haptic';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { ChoiceRow } from './ChoiceRow';
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
      {aircoSettings(airco).map((setting) => (
        <ChoiceRow
          key={setting.title}
          title={setting.title}
          options={setting.options}
          chosenValue={setting.chosenValue}
          onChoose={(chosenValue) => setting.choose(hass, chosenValue)}
          hasTallerButtons={setting.hasTallerButtons}
        />
      ))}
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
