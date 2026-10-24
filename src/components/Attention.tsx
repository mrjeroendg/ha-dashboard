import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ATTENTION } from '../config/attention';
import { activeWarnings, type Warning } from '../lib/attention';
import { useWarningStack } from '../hooks/useWarningStack';
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
 * the stack slides them out into a list; "Minder" slides them back.
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

  return (
    <div className="attention">
      {hasMoreThanOneWarning ? (
        <>
          <WarningStack isStacked={isStacked} warningCount={warnings.length} onOpen={openList}>
            {warnings.map((warning, position) => (
              <WarningBanner
                key={warning.key}
                warning={warning}
                onView={viewHandlerFor(warning)}
                hiddenCount={position === 0 ? warnings.length - 1 : undefined}
                isBehindFront={isStacked && position > 0}
              />
            ))}
          </WarningStack>
          <button
            type="button"
            className="attention__less"
            onClick={closeList}
            aria-hidden={isStacked}
            tabIndex={isStacked ? -1 : undefined}
          >
            <Icon name="chevronUp" />
            Minder
          </button>
        </>
      ) : (
        <WarningBanner warning={warnings[0]} onView={viewHandlerFor(warnings[0])} />
      )}
      {openWarning?.sheet && (
        <BottomSheet label={openWarning.title} onClose={closeSheet}>
          <openWarning.sheet hass={hass} entity={openWarning.entity} close={closeSheet} />
        </BottomSheet>
      )}
    </div>
  );
}

interface WarningStackProps {
  isStacked: boolean;
  warningCount: number;
  onOpen(): void;
  children: ReactNode;
}

function WarningStack({ isStacked, warningCount, onOpen, children }: WarningStackProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const isMotionEnabled = useWarningStack(stackRef, isStacked, warningCount);

  return (
    <div
      ref={stackRef}
      className={`attention-stack${isStacked ? ' is-stacked' : ''}${isMotionEnabled ? ' has-motion' : ''}`}
      role={isStacked ? 'button' : undefined}
      tabIndex={isStacked ? 0 : undefined}
      aria-expanded={isStacked ? false : undefined}
      aria-label={isStacked ? `${warningCount} waarschuwingen, tik om ze allemaal te zien` : undefined}
      onClick={isStacked ? onOpen : undefined}
      onKeyDown={(keyboardEvent) => {
        const isOpenKey = keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ';
        if (isStacked && isOpenKey) onOpen();
      }}
    >
      {children}
    </div>
  );
}

interface WarningBannerProps {
  warning: Warning;
  onView?: () => void;
  /** On the front of the stack: how many warnings are behind it ("+3"). */
  hiddenCount?: number;
  /** Tucked under the front banner: its content is hidden and it can't be tapped. */
  isBehindFront?: boolean;
}

function WarningBanner({ warning, onView, hiddenCount, isBehindFront }: WarningBannerProps) {
  return (
    <div className={`attention__item attention--${warning.level}`} role="alert" aria-hidden={isBehindFront}>
      <span className="attention__icon">
        <Icon name={warning.icon} />
      </span>
      <span className="attention__text">
        <span className="attention__title">{warning.title}</span>
        <span className="attention__detail">{warning.detail}</span>
      </span>
      {/* Before "Bekijk", so "Bekijk" always sits on the right edge. */}
      {hiddenCount !== undefined && <span className="attention__more">+{hiddenCount}</span>}
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
    </div>
  );
}
