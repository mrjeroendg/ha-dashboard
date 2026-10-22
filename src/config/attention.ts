import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { IconName } from '../components/Icon';

export type AttentionLevel = 'high' | 'medium' | 'low';

export interface AttentionRule {
  entity: string;
  level: AttentionLevel;
  when?: string[] | ((entity: HassEntity, states: HassEntities) => boolean);
  title?: string;
  icon?: IconName;
  detail?: (entity: HassEntity, states: HassEntities) => string;
}

export const ATTENTION: AttentionRule[] = [
  {
    entity: 'sensor.garage_door_state_classification',
    level: 'high',
    when: ['open'],
    title: 'Garagepoort staat open',
    icon: 'garage'
  },
  {
    entity: 'update.irpi_admin_version',
    level: 'low',
    title: 'Immich update'
  },
  {
    entity: 'update.garage_paperless_software',
    level: 'low',
    title: 'Paperless update'
  },
  {
    entity: 'sensor.jeroens_ipad_battery_level',
    level: 'high',
    title: 'iPad batterij laag',
    icon: 'tablet',
    when: (e, states) => {
      const batteryPercentage = Number(e.state);
      const chargingState = states['sensor.jeroens_ipad_battery_state']?.state

      return batteryPercentage <= 15 && chargingState !== 'Charging'
    },
    detail: (e) => `${e.state}%`,
  },
  {
    entity: 'sensor.iphone_16_pro_battery_level',
    level: 'high',
    title: 'iPhone batterij laag',
    icon: 'phone',
    when: (e, states) => {
      const batteryPercentage = Number(e.state);
      const chargingState = states['sensor.jeroens_ipad_battery_state']?.state

      return batteryPercentage <= 14 && chargingState !== 'Charging'
    }, detail: (e) => `${e.state}%`,
  },
];
