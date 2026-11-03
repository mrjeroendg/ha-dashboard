import { useState } from 'react';
import { haptic } from '../../lib/haptic';
import type { HomeAssistant } from '../../types/hass';
import { EnergyNow } from './EnergyNow';
import { GasLastDays } from './GasLastDays';
import { QuarterPeak } from './QuarterPeak';
import { TodaySoFar } from './TodaySoFar';
import { WaterNow } from './WaterNow';
import { WaterToday } from './WaterToday';

interface Props {
  hass: HomeAssistant;
}

type EnergyTab = 'stroom' | 'gas' | 'water';

const TABS: Array<{ id: EnergyTab; name: string }> = [
  { id: 'stroom', name: 'Stroom' },
  { id: 'gas', name: 'Gas' },
  { id: 'water', name: 'Water' },
];

/**
 * The Energie page's content, without section titles, behind chips like a
 * room's tabs (docs/design/energie-gas). "Stroom" (docs/design/energie-page,
 * S2): one card for now (the power with its 5-minute bars, a thin line, then
 * the quarter-hour), and the day tiles below it. "Gas": today's gas with the
 * last 14 days. "Water" (docs/design/energie-water): like Stroom, the flow
 * now with the last 2 hours as bars, and today's water below it. It always
 * opens on Stroom.
 */
export function EnergyPage({ hass }: Props) {
  const [activeTab, setActiveTab] = useState<EnergyTab>('stroom');

  const selectTab = (tab: EnergyTab) => {
    haptic('selection');
    setActiveTab(tab);
  };

  return (
    <>
      <div className="room-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="room-tab"
            aria-selected={tab.id === activeTab}
            onClick={() => selectTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {activeTab === 'stroom' && (
        <>
          <div className="energy-card energy-page__now">
            <EnergyNow hass={hass} />
            <QuarterPeak hass={hass} />
          </div>
          <TodaySoFar hass={hass} />
        </>
      )}
      {activeTab === 'gas' && (
        <div className="energy-page__now">
          <GasLastDays hass={hass} />
        </div>
      )}
      {activeTab === 'water' && (
        <>
          <div className="energy-card energy-page__now">
            <WaterNow hass={hass} />
          </div>
          <WaterToday hass={hass} />
        </>
      )}
    </>
  );
}
