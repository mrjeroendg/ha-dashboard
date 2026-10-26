import { useState } from 'react';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import type { StatusEntity } from '../config/status';
import { entriesThatAreOn, WHAT_IS_ON_GROUPS } from '../lib/houseStatus';
import { rowModel } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
  onClose(): void;
}

/**
 * "Wat staat aan" (docs/design/whats-on), opened from the status line: what the
 * status line counts as on, per group, each with only a switch. What you turn
 * off stays in the list until the sheet closes, so you can turn it back on.
 */
export function WhatIsOnSheet({ hass, onClose }: Props) {
  // Taken once when the sheet opens: rows don't disappear while you're looking at them.
  const [groupsWhenOpened] = useState(() =>
    WHAT_IS_ON_GROUPS.map((group) => ({ ...group, entriesOn: entriesThatAreOn(hass.states, group.statusEntries) })).filter(
      (group) => group.entriesOn.length > 0,
    ),
  );

  return (
    <BottomSheet label="Wat staat aan" className="whats-on-sheet" onClose={onClose}>
      <h2 className="whats-on-sheet__title">Wat staat aan</h2>
      {groupsWhenOpened.length === 0 ? (
        <EmptyState icon="check" text="Alles staat uit" />
      ) : (
        <>
          <p className="whats-on-sheet__count">{countStillOn(hass, groupsWhenOpened)}</p>
          {groupsWhenOpened.map((group) => (
            <section key={group.title}>
              <h3 className="safety-sheet__section">{group.title}</h3>
              <div className="row-group">
                {group.entriesOn.map((statusEntry) => (
                  <SwitchRow key={statusEntry.entity} hass={hass} statusEntry={statusEntry} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </BottomSheet>
  );
}

type GroupWhenOpened = (typeof WHAT_IS_ON_GROUPS)[number] & { entriesOn: StatusEntity[] };

/** "2 lichten aan" while there's one group; "3 dingen aan" once there are more (e.g. aircos too). */
function countStillOn(hass: HomeAssistant, groupsWhenOpened: GroupWhenOpened[]) {
  const stillOnPerGroup = groupsWhenOpened.map((group) => entriesThatAreOn(hass.states, group.entriesOn).length);
  const totalStillOn = stillOnPerGroup.reduce((total, stillOnInGroup) => total + stillOnInGroup, 0);
  const isOnlyOneGroup = groupsWhenOpened.length === 1;

  if (totalStillOn === 0) return 'Alles uitgezet';
  if (isOnlyOneGroup) return totalStillOn === 1 ? groupsWhenOpened[0].oneOn : `${totalStillOn} ${groupsWhenOpened[0].manyOn}`;
  return totalStillOn === 1 ? '1 ding aan' : `${totalStillOn} dingen aan`;
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
