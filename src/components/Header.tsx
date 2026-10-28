import { useState } from 'react';
import { BIRTHDAYS } from '../config/status';
import { useNow } from '../hooks/useNow';
import { useTodoItems } from '../hooks/useTodoItems';
import { formatDate, greeting } from '../lib/greeting';
import { commute, houseStatusItems, type StatusItem } from '../lib/houseStatus';
import { haptic } from '../lib/haptic';
import type { DashboardConfig, HomeAssistant } from '../types/hass';
import { StatusTicker } from './StatusTicker';
import { WhatIsOnSheet } from './WhatIsOnSheet';

interface Props {
  hass?: HomeAssistant;
  config: DashboardConfig;
}

export function Header({ hass, config }: Props) {
  const now = useNow();
  const name = config.name ?? hass?.user?.name;
  const birthdayItems = useTodoItems(hass, BIRTHDAYS.todoList) ?? [];
  const birthdayNames = birthdayItems.filter((todoItem) => todoItem.status === 'needs_action').map((todoItem) => todoItem.summary);
  const statusItems = hass ? houseStatusItems(hass, now, birthdayNames) : [];

  return (
    <header className="header">
      <p className="header__date">{formatDate(now)}</p>
      <h1 className="header__greeting">{greeting(now, name)}</h1>
      {/* Nothing listed in src/config/status.ts: no status band. */}
      {hass && statusItems.length > 0 && <StatusBand hass={hass} now={now} statusItems={statusItems} birthdayNames={birthdayNames} />}
      {!hass && (
        <p className="header__status">
          <span className="header__dot header__dot--idle" aria-hidden />
          Verbinden met Home Assistant…
        </p>
      )}
    </header>
  );
}

interface StatusBandProps {
  hass: HomeAssistant;
  now: Date;
  statusItems: StatusItem[];
  birthdayNames: string[];
}

/** The scrolling status band; tapping it opens "Nu" (docs/design/now-ticker). */
function StatusBand({ hass, now, statusItems, birthdayNames }: StatusBandProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openSheet = () => {
    haptic('selection');
    setIsSheetOpen(true);
  };

  return (
    <>
      <StatusTicker statusItems={statusItems} onOpen={openSheet} />
      {isSheetOpen && (
        <WhatIsOnSheet hass={hass} travelTimeHome={commute(hass, now)} birthdayNames={birthdayNames} onClose={() => setIsSheetOpen(false)} />
      )}
    </>
  );
}
