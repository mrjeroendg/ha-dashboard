import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { ComponentType } from 'react';
import type { IconName } from '../components/Icon';
import type { AttentionLevel, AttentionRule, WarningSheetProps } from '../config/attention';

export interface Warning {
  key: string;
  entityId: string;
  level: AttentionLevel;
  icon: IconName;
  title: string;
  detail: string;
  /** When the state started (ms), for sorting newest first. */
  since: number;
  entity: HassEntity;
  /** Opened with "Bekijk"; without it the warning only warns. */
  sheet?: ComponentType<WarningSheetProps>;
}

const ORDER: Record<AttentionLevel, number> = { high: 0, medium: 1, babysit: 2, catsit: 3, low: 4 };

const domainOf = (id: string) => id.split('.')[0];

function triggerStates(entity: HassEntity): string[] {
  switch (domainOf(entity.entity_id)) {
    case 'cover':
      return ['open', 'opening'];
    case 'lock':
      return ['unlocked', 'open'];
    default:
      return ['on'];
  }
}

function defaultIcon(entity: HassEntity): IconName {
  const dc = String(entity.attributes.device_class ?? '');
  switch (domainOf(entity.entity_id)) {
    case 'update':
      return 'update';
    case 'lock':
      return 'lock';
    case 'cover':
      return dc === 'garage' ? 'garage' : 'blinds';
  }
  if (dc === 'window') return 'window';
  if (dc === 'door' || dc === 'garage_door') return 'door';
  return 'alert';
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

function warningFor(rule: AttentionRule, entity: HassEntity, states: HassEntities): Warning | undefined {
  const when = rule.when ?? triggerStates(entity);
  const active = typeof when === 'function' ? when(entity, states) : when.includes(entity.state);
  if (!active) return undefined;

  const since = Date.parse(entity.last_changed);

  const a = entity.attributes;
  const name = String(a.title ?? a.friendly_name ?? entity.entity_id);
  const isUpdate = domainOf(entity.entity_id) === 'update';

  return {
    key: entity.entity_id,
    entityId: entity.entity_id,
    level: rule.level,
    icon: rule.icon ?? defaultIcon(entity),
    title: rule.title ?? (isUpdate ? `Update voor ${name}` : name),
    detail: rule.detail
      ? rule.detail(entity, states)
      : isUpdate
        ? `${a.installed_version ?? '?'} → ${a.latest_version ?? '?'}`
        : `Sinds ${clock(since)}`,
    since,
    entity,
    sheet: rule.sheet,
  };
}

/** Every active warning: highest level first, newest first within a level. */
export function activeWarnings(states: HassEntities, rules: AttentionRule[]): Warning[] {
  return rules
    .map((rule) => states[rule.entity] && warningFor(rule, states[rule.entity], states))
    .filter((w): w is Warning => Boolean(w))
    .sort((a, b) => ORDER[a.level] - ORDER[b.level] || b.since - a.since);
}
