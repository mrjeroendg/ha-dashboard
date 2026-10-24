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
 */
export function Attention({ hass }: Props) {
  const warnings = useMemo(() => activeWarnings(hass.states, ATTENTION), [hass.states]);
  const [openWarningKey, setOpenWarningKey] = useState<string | null>(null);
  // Looked up by key, so the open sheet always gets the warning's latest state.
  const openWarning = warnings.find((warning) => warning.key === openWarningKey);
  const closeSheet = () => setOpenWarningKey(null);

  if (warnings.length === 0) return null;

  return (
    <div className="attention">
      {warnings.map((warning) => (
        <WarningBanner
          key={warning.key}
          warning={warning}
          onView={
            warning.sheet
              ? () => {
                  haptic('selection');
                  setOpenWarningKey(warning.key);
                }
              : undefined
          }
        />
      ))}
      {openWarning?.sheet && (
        <BottomSheet label={openWarning.title} onClose={closeSheet}>
          <openWarning.sheet hass={hass} entity={openWarning.entity} close={closeSheet} />
        </BottomSheet>
      )}
    </div>
  );
}

function WarningBanner({ warning, onView }: { warning: Warning; onView?: () => void }) {
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
        <button type="button" className="attention__view" onClick={onView}>
          Bekijk
        </button>
      )}
    </div>
  );
}
