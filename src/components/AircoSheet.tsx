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
  type AircoSetting,
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
      {aircoSettings(airco).map((setting) => (
        <SettingChoice key={setting.title} hass={hass} setting={setting} />
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

/**
 * A row of icons, one per option; the chosen one is filled and named above the
 * row. A choice shows at once; HA's report takes over when it arrives. Hidden
 * when the airco offers nothing for it.
 */
function SettingChoice({ hass, setting }: { hass: HomeAssistant; setting: AircoSetting }) {
  const choiceControl = useControlValue(setting.chosenValue, (valueFromEntity, valueInApp) => valueFromEntity === valueInApp);
  const chosenValueInApp = choiceControl.currentValueInApp;

  if (setting.options.length === 0) return null;

  const chosenOption = setting.options.find((option) => option.value === chosenValueInApp);

  const choose = (chosenValue: string) => {
    if (chosenValue === chosenValueInApp) return;

    haptic('selection');
    choiceControl.keepAfterRelease(chosenValue);
    setting.choose(hass, chosenValue).catch((error) => {
      console.error(error);
      choiceControl.showValueFromEntity();
    });
  };

  return (
    <div className="airco-choice">
      <p className="airco-choice__title">
        {setting.title}
        {chosenOption && <span className="airco-choice__chosen">{chosenOption.name}</span>}
      </p>
      <div
        className={`airco-choice__options${setting.hasTallerButtons ? ' airco-choice__options--taller' : ''}`}
        role="group"
        aria-label={setting.title}
      >
        {setting.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="airco-choice__option"
            aria-label={option.name}
            aria-pressed={option.value === chosenValueInApp}
            onClick={() => choose(option.value)}
          >
            <Icon name={option.icon} />
          </button>
        ))}
      </div>
    </div>
  );
}
