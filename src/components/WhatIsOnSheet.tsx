import { useState } from 'react';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import type { StatusEntity } from '../config/status';
import { BIRTHDAYS } from '../config/status';
import { entriesThatAreOn, WAZE_ROUTE_HOME, WHAT_IS_ON_GROUPS } from '../lib/houseStatus';
import { rowModel } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
  /** "34 min naar huis" on Jeroen's office days; without it, no "Naar huis". */
  travelTimeHome?: string;
  /** Today's birthdays; without any, no "Jarig". */
  birthdayNames: string[];
  onClose(): void;
}

/**
 * "Nu" (docs/design/whats-on, now-ticker), opened from the status band: the
 * route home in Waze on office days, today's birthdays, then what the band counts as on, per
 * group, each with only a switch. What you turn off stays in the list until
 * the sheet closes, so you can turn it back on.
 */
export function WhatIsOnSheet({ hass, travelTimeHome, birthdayNames, onClose }: Props) {
  // Taken once when the sheet opens: rows don't disappear while you're looking at them.
  const [groupsWhenOpened] = useState(() =>
    WHAT_IS_ON_GROUPS.map((group) => ({ ...group, entriesOn: entriesThatAreOn(hass.states, group.statusEntries) })).filter(
      (group) => group.entriesOn.length > 0,
    ),
  );

  return (
    <BottomSheet label="Nu" className="whats-on-sheet" onClose={onClose}>
      <h2 className="whats-on-sheet__title">Nu</h2>
      {travelTimeHome && <RouteHome travelTimeHome={travelTimeHome} />}
      {birthdayNames.length > 0 && <Birthdays birthdayNames={birthdayNames} />}
      {groupsWhenOpened.length === 0 ? (
        <EmptyState icon="check" text="Alles staat uit" />
      ) : (
        groupsWhenOpened.map((group) => (
          <section key={group.title}>
            <h3 className="safety-sheet__section">{group.title}</h3>
            <div className="row-group">
              {group.entriesOn.map((statusEntry) => (
                <SwitchRow key={statusEntry.entity} hass={hass} statusEntry={statusEntry} />
              ))}
            </div>
          </section>
        ))
      )}
    </BottomSheet>
  );
}

/** "Naar huis" (docs/design/now-ticker): "Start route" opens Waze with the route to the "Home" favourite. */
function RouteHome({ travelTimeHome }: { travelTimeHome: string }) {
  return (
    <section>
      <h3 className="safety-sheet__section">Naar huis</h3>
      <div className="row-group">
        <div className="row-item row">
          <span className="icon-tile is-on">
            <Icon name="car" />
          </span>
          <span className="card-text">
            <span className="row__name">{travelTimeHome}</span>
            <span className="card-detail">Route in Waze</span>
          </span>
          <a className="pill-button" href={WAZE_ROUTE_HOME} target="_blank" rel="noreferrer" onClick={() => haptic('light')}>
            Start route
          </a>
        </div>
      </div>
    </section>
  );
}

/** "Jarig" (docs/design/now-ticker): one row per birthday today, with "WhatsApp" to congratulate them. */
function Birthdays({ birthdayNames }: { birthdayNames: string[] }) {
  return (
    <section>
      <h3 className="safety-sheet__section">Jarig</h3>
      <div className="row-group">
        {birthdayNames.map((birthdayName, position) => (
          <div key={`${position}-${birthdayName}`} className="row-item row">
            <span className="icon-tile is-on" style={{ background: BIRTHDAYS.color }}>
              <Icon name={BIRTHDAYS.icon} />
            </span>
            <span className="card-text">
              <span className="row__name">{birthdayName}</span>
              <span className="card-detail">Vandaag</span>
            </span>
            <a className="pill-button" href={BIRTHDAYS.whatsAppUrl} target="_blank" rel="noreferrer" onClick={() => haptic('light')}>
              WhatsApp
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Icon, name (from the status config, or HA's), state and a switch; nothing else to tap. */
function SwitchRow({ hass, statusEntry }: { hass: HomeAssistant; statusEntry: StatusEntity }) {
  const [status, run] = useRunAction();
  const entity = hass.states[statusEntry.entity];
  if (!entity) return null;

  const model = rowModel(entity);
  const name = statusEntry.name ?? String(entity.attributes.friendly_name ?? statusEntry.entity);
  const toggle = model.run;

  return (
    <div className="row-item">
      <button
        type="button"
        className={`row status-${status}`}
        role="switch"
        aria-checked={model.on}
        disabled={!toggle}
        onClick={() => {
          if (!toggle) return;
          haptic('light');
          run(() => toggle(hass));
        }}
      >
        <span className={`icon-tile${model.on ? ' is-on' : ''}`}>
          <Icon name={model.icon} />
        </span>
        <span className="card-text">
          <span className="row__name">{name}</span>
          <span className={`card-detail${status === 'error' ? ' is-error' : ''}`}>{status === 'error' ? 'Dat lukte niet' : model.detail}</span>
        </span>
        <span className={`switch${model.on ? ' is-on' : ''}`} aria-hidden />
      </button>
    </div>
  );
}
