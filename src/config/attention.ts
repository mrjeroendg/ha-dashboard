import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { ComponentType } from 'react';
import { BabysitSheet } from '../components/sheets/BabysitSheet';
import type { IconName } from '../components/Icon';
import type { HomeAssistant } from '../types/hass';

export type AttentionLevel = 'high' | 'medium' | 'babysit' | 'low';

export interface WarningSheetProps {
  hass: HomeAssistant;
  entity: HassEntity;
  close(): void;
}

export interface AttentionRule {
  entity: string;
  level: AttentionLevel;
  when?: string[] | ((entity: HassEntity, states: HassEntities) => boolean);
  title?: string;
  icon?: IconName;
  detail?: (entity: HassEntity, states: HassEntities) => string;
  sheet?: ComponentType<WarningSheetProps>;
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
  {
    entity: 'todo.babysitter_needed',
    level: 'babysit',
    title: 'Oppas nodig',
    icon: 'baby',
    when: (babysitList) => Number(babysitList.state) > 0,
    detail: (babysitList) => {
      const openAppointments = Number(babysitList.state);
      const appointmentsNeedAttention = openAppointments === 1 ? 'afspraak vraagt' : 'afspraken vragen';

      return `${openAppointments} ${appointmentsNeedAttention} aandacht`;
    },
    sheet: BabysitSheet,
  },
];
