import { useControlValue } from '../hooks/useControlValue';
import { haptic } from '../lib/haptic';
import { Icon, type IconName } from './Icon';

export interface ChoiceOption {
  /** What HA calls it, e.g. "heat" or "3". */
  value: string;
  /** Shown above the row when chosen, and read out by screen readers. */
  name: string;
  icon?: IconName;
  /** Shown instead of an icon, e.g. a zone's name. */
  label?: string;
  /** Dimmed and not tappable, but still filled when it's the chosen one (e.g. the mower's Maaien). */
  isDisabled?: boolean;
}

interface Props {
  title: string;
  options: ChoiceOption[];
  chosenValue?: string;
  onChoose(value: string): Promise<unknown>;
  /** E.g. the airco's mode row: slightly taller buttons. */
  hasTallerButtons?: boolean;
}

/**
 * A row of buttons in a sheet, one per option (docs/design/airco-sheet); the
 * chosen one is filled and named above the row. A choice shows at once; HA's
 * report takes over when it arrives. Hidden when there's nothing to choose.
 */
export function ChoiceRow({ title, options, chosenValue, onChoose, hasTallerButtons }: Props) {
  const choiceControl = useControlValue(chosenValue, (valueFromEntity, valueInApp) => valueFromEntity === valueInApp);
  const chosenValueInApp = choiceControl.currentValueInApp;

  if (options.length === 0) return null;

  const chosenOption = options.find((option) => option.value === chosenValueInApp);

  const choose = (newChosenValue: string) => {
    if (newChosenValue === chosenValueInApp) return;

    haptic('selection');
    choiceControl.keepAfterRelease(newChosenValue);
    onChoose(newChosenValue).catch((error) => {
      console.error(error);
      choiceControl.showValueFromEntity();
    });
  };

  return (
    <div className="choice-row">
      <p className="choice-row__title">
        {title}
        {chosenOption && <span className="choice-row__chosen">{chosenOption.name}</span>}
      </p>
      <div className={`choice-row__options${hasTallerButtons ? ' choice-row__options--taller' : ''}`} role="group" aria-label={title}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`choice-row__option${option.isDisabled ? ' is-disabled' : ''}`}
            aria-label={option.name}
            aria-pressed={option.value === chosenValueInApp}
            disabled={option.isDisabled}
            onClick={() => choose(option.value)}
          >
            {option.icon ? <Icon name={option.icon} /> : <span className="choice-row__label">{option.label ?? option.name}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
