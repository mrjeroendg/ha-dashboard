import { useMemo, useState } from 'react';
import { ATTENTION } from '../config/attention';
import { useNow } from '../hooks/useNow';
import { activeWarnings, type Warning } from '../lib/attention';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
}

/** Warnings under the status line. They can't be closed; they go away once fixed. */
export function Attention({ hass }: Props) {
  // Re-evaluated every minute too, so "Al 25 min" and `after` keep up.
  const now = useNow();
  const warnings = useMemo(() => activeWarnings(hass.states, ATTENTION, now.getTime()), [hass.states, now]);
  if (warnings.length === 0) return null;

  return (
    <div className="attention">
      {warnings.map((w) => (
        <WarningBanner key={w.key} warning={w} hass={hass} />
      ))}
    </div>
  );
}

function WarningBanner({ warning, hass }: { warning: Warning; hass: HomeAssistant }) {
  // A picture that doesn't load (e.g. no internet for HA's brand images) falls back to the icon.
  const [failed, setFailed] = useState<string>();
  const picture = warning.picture && warning.picture !== failed ? warning.picture : undefined;

  return (
    <div className={`attention__item attention--${warning.level}`} role="alert">
      <span className={`attention__icon${picture ? ' attention__icon--picture' : ''}`}>
        {picture ? (
          <img src={hass.hassUrl ? hass.hassUrl(picture) : picture} alt="" onError={() => setFailed(picture)} />
        ) : (
          <Icon name={warning.icon} />
        )}
      </span>
      <span className="attention__text">
        <span className="attention__title">{warning.title}</span>
        <span className="attention__detail">{warning.detail}</span>
      </span>
    </div>
  );
}
