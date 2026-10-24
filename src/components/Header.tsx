import { useMemo } from 'react';
import { useNow } from '../hooks/useNow';
import { formatDate, greeting } from '../lib/greeting';
import { commute, houseStatus, WAZE_ROUTE_HOME } from '../lib/houseStatus';
import type { DashboardConfig, HomeAssistant } from '../types/hass';

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
      {status && (
        <p className="header__status">
          <span className={`header__dot${hass ? '' : ' header__dot--idle'}`} aria-hidden />
          <span>
            {/* Office days only (docs/design/commute); tapping it opens the route home in Waze. */}
            {travelTimeHome && (
              <>
                <a className="header__commute" href={WAZE_ROUTE_HOME} target="_blank" rel="noreferrer">
                  {travelTimeHome}
                </a>
                {' · '}
              </>
            )}
            {status}
          </span>
        </p>
      )}
    </header>
  );
}
