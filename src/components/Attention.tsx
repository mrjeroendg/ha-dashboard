import { useMemo, useState } from 'react';
import { ATTENTION } from '../config/attention';
import { activeWarnings, type Warning } from '../lib/attention';
import { haptic } from '../lib/haptic';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
}

/**
 * Warnings under the status line. They can't be closed; they go away once
 * fixed. A warning with a `sheet` in the config gets a "Bekijk" button that
 * opens that sheet.
 *
 * Two or more warnings are stacked (docs/design/warning-stack): the most
 * important one in front with "+N", the next ones peeking out below. Tapping
 * the stack lists them all; "Minder" stacks them again.
 */
export function Attention({ hass }: Props) {
  const warnings = useMemo(() => activeWarnings(hass.states, ATTENTION), [hass.states]);
  const [isListOpen, setIsListOpen] = useState(false);
  const [openWarningKey, setOpenWarningKey] = useState<string | null>(null);
  // Looked up by key, so the open sheet always gets the warning's latest state.
  const openWarning = warnings.find((warning) => warning.key === openWarningKey);
  const closeSheet = () => setOpenWarningKey(null);

  if (warnings.length === 0) return null;

  const viewHandlerFor = (warning: Warning) =>
    warning.sheet
      ? () => {
          haptic('selection');
          setOpenWarningKey(warning.key);
        }
      : undefined;

  const openList = () => {
    haptic('selection');
    setIsListOpen(true);
  };
  const closeList = () => {
    haptic('selection');
    setIsListOpen(false);
  };

  const hasMoreThanOneWarning = warnings.length > 1;
  const isStacked = hasMoreThanOneWarning && !isListOpen;
  const [frontWarning, ...warningsBehind] = warnings;

  return (
    <div className="attention">
      {isStacked ? (
        <div
          className="attention-stack"
          role="button"
          tabIndex={0}
          aria-expanded={false}
          aria-label={`${warnings.length} waarschuwingen, tik om ze allemaal te zien`}
          onClick={openList}
          onKeyDown={(keyboardEvent) => {
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') openList();
          }}
        >
          <WarningBanner warning={frontWarning} onView={viewHandlerFor(frontWarning)} hiddenCount={warningsBehind.length} />
          {/* At most two peek out, each in its own colour. */}
          {warningsBehind.slice(0, 2).map((warningBehind, positionBehind) => (
            <span
              key={warningBehind.key}
              className={`attention-stack__peek attention-stack__peek--${positionBehind + 1} attention--${warningBehind.level}`}
              aria-hidden
            />
          ))}
        </div>
      ) : (
        warnings.map((warning) => <WarningBanner key={warning.key} warning={warning} onView={viewHandlerFor(warning)} />)
      )}
      {hasMoreThanOneWarning && isListOpen && (
        <button type="button" className="attention__less" onClick={closeList}>
          <Icon name="chevronUp" />
          Minder
        </button>
      )}
      {openWarning?.sheet && (
        <BottomSheet label={openWarning.title} onClose={closeSheet}>
          <openWarning.sheet hass={hass} entity={openWarning.entity} close={closeSheet} />
        </BottomSheet>
      )}
    </div>
  );
}

interface WarningBannerProps {
  warning: Warning;
  onView?: () => void;
  /** On the front of the stack: how many warnings are behind it ("+3"). */
  hiddenCount?: number;
}

function WarningBanner({ warning, onView, hiddenCount }: WarningBannerProps) {
  return (
    <div className={`attention__item attention--${warning.level}`} role="alert">
      <span className="attention__icon">
        <Icon name={warning.icon} />
      </span>
      <span className="attention__text">
        <span className="attention__title">{warning.title}</span>
        <span className="attention__detail">{warning.detail}</span>
      </span>
      {onView && (
        <button
          type="button"
          className="attention__view"
          onClick={(clickEvent) => {
            // Inside the stack: open the sheet, not the list.
            clickEvent.stopPropagation();
            onView();
          }}
        >
          Bekijk
        </button>
      )}
      {hiddenCount !== undefined && <span className="attention__more">+{hiddenCount}</span>}
    </div>
  );
}
