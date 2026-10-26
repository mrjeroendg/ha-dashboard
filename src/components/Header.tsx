import { useMemo, useState } from 'react';
import { useNow } from '../hooks/useNow';
import { formatDate, greeting } from '../lib/greeting';
import { commute, houseStatus, WAZE_ROUTE_HOME } from '../lib/houseStatus';
import { haptic } from '../lib/haptic';
import type { DashboardConfig, HomeAssistant } from '../types/hass';
import { Icon } from './Icon';
import { WhatIsOnSheet } from './WhatIsOnSheet';

interface Props {
  hass?: HomeAssistant;
  config: DashboardConfig;
}

export function Header({ hass, config }: Props) {
  const now = useNow();
  const name = config.name ?? hass?.user?.name;
  const status = useMemo(() => (hass ? houseStatus(hass.states) : 'Verbinden met Home Assistant…'), [hass]);
  const travelTimeHome = hass ? commute(hass, now) : undefined;

  return (
    <header className="header">
      <p className="header__date">{formatDate(now)}</p>
      <h1 className="header__greeting">{greeting(now, name)}</h1>
      {/* Nothing listed in src/config/status.ts: no status line. */}
      {status && hass && <StatusLine hass={hass} status={status} travelTimeHome={travelTimeHome} />}
      {status && !hass && (
        <p className="header__status">
          <span className="header__dot header__dot--idle" aria-hidden />
          {status}
        </p>
      )}
    </header>
  );
}

interface StatusLineProps {
  hass: HomeAssistant;
  status: string;
  travelTimeHome?: string;
}

/** The grey status box; tapping it opens "Wat staat aan" (docs/design/whats-on). */
function StatusLine({ hass, status, travelTimeHome }: StatusLineProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openSheet = () => {
    haptic('selection');
    setIsSheetOpen(true);
  };

  return (
    <>
      {/* A div, not a button: the Waze link inside can't sit in a button. */}
      <div
        className="header__status header__status--opens-sheet"
        role="button"
        tabIndex={0}
        onClick={openSheet}
        onKeyDown={(keyboardEvent) => {
          const isOpenKey = keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ';
          if (isOpenKey) openSheet();
        }}
      >
        <span className="header__dot" aria-hidden />
        <span>
          {/* Office days only (docs/design/commute); tapping it opens the route home in Waze, not the sheet. */}
          {travelTimeHome && (
            <>
              <a
                className="header__commute"
                href={WAZE_ROUTE_HOME}
                target="_blank"
                rel="noreferrer"
                onClick={(clickEvent) => clickEvent.stopPropagation()}
              >
                {travelTimeHome}
              </a>
              {' · '}
            </>
          )}
          {status}
        </span>
        <span className="header__chevron" aria-hidden>
          <Icon name="chevron" />
        </span>
      </div>
      {isSheetOpen && <WhatIsOnSheet hass={hass} onClose={() => setIsSheetOpen(false)} />}
    </>
  );
}
