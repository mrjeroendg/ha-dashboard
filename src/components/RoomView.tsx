import { useState, type CSSProperties } from 'react';
import { haptic } from '../lib/haptic';
import { roomClimate, roomSafety, type ResolvedRoom } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { EntityControl } from './EntityControl';
import { Icon } from './Icon';
import { QuickCard } from './QuickCard';
import { SafetySheet } from './SafetySheet';

interface Props {
  room: ResolvedRoom;
  hass: HomeAssistant;
}

export function RoomView({ room, hass }: Props) {
  // Always starts on the first tab: the page remounts for every room.
  const [tab, setTab] = useState(0);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const sections = room.sections;
  const section = sections[Math.min(tab, sections.length - 1)];
  const tabs = sections.length > 1;
  const climate = roomClimate(room, hass.states);
  const safety = roomSafety(room, hass.states);

  return (
    <>
      <header className="header">
        <p className="header__date">Kamer</p>
        <div className="room-header">
          <div className="room-header__main">
            <h1 className="header__greeting">{room.name}</h1>
            {safety && (
              <button
                type="button"
                className={`room-safety${safety.level ? ' is-lit' : ''}`}
                onClick={() => {
                  haptic('selection');
                  setSafetyOpen(true);
                }}
              >
                <span className={`safety-dot${safety.level ? ` is-${safety.level}` : ''}`} aria-hidden />
                {safety.summary}
                <Icon name="chevron" />
              </button>
            )}
          </div>
          {climate && (
            <div className="room-header__climate">
              <span className="room-header__value">{climate.value}</span>
              {climate.label && <span className="room-header__label">{climate.label}</span>}
            </div>
          )}
        </div>
      </header>
      {tabs && (
        <div className="room-tabs" role="tablist">
          {sections.map((s, i) => (
            <button
              key={s.title ?? i}
              type="button"
              role="tab"
              className="room-tab"
              aria-selected={s === section}
              onClick={() => {
                haptic('selection');
                setTab(i);
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
      {section.shortcuts.length > 0 && (
        <>
          <h2 className="section-title section-title--tab">Snel</h2>
          <div className="quick-row" style={{ '--n': section.shortcuts.length } as CSSProperties}>
            {section.shortcuts.map((s) => (
              <QuickCard key={`${s.entity}-${s.label}`} shortcut={s} hass={hass} />
            ))}
          </div>
        </>
      )}
      {section.rows.length > 0 && (
        <section className={`row-group${tabs ? ' row-group--tabbed' : ''}`}>
          {section.rows.map((row) => (
            <EntityControl
              key={row.entity.entity_id}
              entity={row.entity}
              name={row.name}
              icon={row.icon}
              options={{ allowUnknownState: row.allowUnknownState, simple: row.simple }}
              myPosition={row.myPosition}
              members={row.members}
              mower={row.mower}
              hass={hass}
            />
          ))}
        </section>
      )}
      {safety && safetyOpen && <SafetySheet room={room.name} {...safety} onClose={() => setSafetyOpen(false)} />}
    </>
  );
}
