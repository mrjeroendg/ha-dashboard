import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';
import type { AttentionLevel, AttentionRule } from '../config/attention';
import { isIgnored } from '../config/ignore';
import { wildcard } from './wildcard';

export interface Warning {
  key: string;
  entityId: string;
  level: AttentionLevel;
  icon: IconName;
  title: string;
  detail: string;
  /** When the state started (ms), for sorting newest first. */
  since: number;
}

const ORDER: Record<AttentionLevel, number> = { high: 0, medium: 1, low: 2 };

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

/** "25 min", "1 u 10 min", "3 dagen". */
function duration(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, Math.floor(minutes))} min`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return m ? `${h} u ${m} min` : `${h} u`;
  }
  const d = Math.floor(minutes / (24 * 60));
  return d === 1 ? '1 dag' : `${d} dagen`;
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

function warningFor(rule: AttentionRule, entity: HassEntity, now: number): Warning | undefined {
  const when = rule.when ?? triggerStates(entity);
  if (!when.includes(entity.state)) return undefined;

  const since = Date.parse(entity.last_changed) || now;
  const minutes = (now - since) / 60_000;

  const a = entity.attributes;
  const name = String(a.title ?? a.friendly_name ?? entity.entity_id);
  const isUpdate = domainOf(entity.entity_id) === 'update';

  return {
    key: entity.entity_id,
    entityId: entity.entity_id,
    level: rule.level,
    icon: rule.icon ?? defaultIcon(entity),
    title: rule.title ?? (isUpdate ? `Update voor ${name}` : name),
    detail: isUpdate
      ? `${a.installed_version ?? '?'} → ${a.latest_version ?? '?'}`
      : `Al ${duration(minutes)} · ${clock(since)}`,
    since,
  };
}

/** Every active warning: highest level first, newest first within a level. */
export function activeWarnings(states: HassEntities, rules: AttentionRule[], now: number): Warning[] {
  const found = new Map<string, Warning>();
  for (const rule of rules) {
    const re = wildcard(rule.entity);
    for (const entity of Object.values(states)) {
      // The first rule that matches an entity wins.
      if (found.has(entity.entity_id) || !re.test(entity.entity_id) || isIgnored(entity.entity_id)) continue;
      const warning = warningFor(rule, entity, now);
      if (warning) found.set(entity.entity_id, warning);
    }
  }
  return [...found.values()].sort((a, b) => ORDER[a.level] - ORDER[b.level] || b.since - a.since);
}
