import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import type { ComponentType } from 'react';
import { BabysitSheet, CatsitSheet } from '../components/sheets/SitterSheet';
import type { IconName } from '../components/Icon';
import type { HomeAssistant } from '../types/hass';
import { Entity } from './entities';

export type AttentionLevel = 'high' | 'medium' | 'babysit' | 'catsit' | 'low';

export interface WarningSheetProps {
  hass: HomeAssistant;
  entity: HassEntity;
  close(): void;
}

export interface AttentionRule {
  entity: Entity;
  level: AttentionLevel;
  when?: string[] | ((entity: HassEntity, states: HassEntities) => boolean);
  title?: string;
  icon?: IconName;
  detail?: (entity: HassEntity, states: HassEntities) => string;
  sheet?: ComponentType<WarningSheetProps>;
}

export const ATTENTION: AttentionRule[] = [
  {
    entity: Entity.GARAGE_DOOR_STATE,
    level: 'high',
    when: ['open'],
    title: 'Garagepoort staat open',
    icon: 'garage'
  },
  {
    entity: Entity.IMMICH_UPDATE,
    level: 'low',
    title: 'Immich update'
  },
  {
    entity: Entity.PAPERLESS_UPDATE,
    level: 'low',
    title: 'Paperless update'
  },
  {
    entity: Entity.JEROENS_IPAD_BATTERY_LEVEL,
    level: 'high',
    title: 'iPad batterij laag',
    icon: 'tablet',
    when: (e, states) => {
      const batteryPercentage = Number(e.state);
      const chargingState = states[Entity.JEROENS_IPAD_BATTERY_STATE]?.state

      return batteryPercentage <= 15 && chargingState !== 'Charging'
    },
    detail: (e) => `${e.state}%`,
  },
  {
    entity: Entity.JEROENS_IPHONE_BATTERY_LEVEL,
    level: 'high',
    title: 'iPhone batterij laag',
    icon: 'phone',
    when: (e, states) => {
      const batteryPercentage = Number(e.state);
      const chargingState = states[Entity.JEROENS_IPHONE_BATTERY_STATE]?.state

      return batteryPercentage <= 14 && chargingState !== 'Charging'
    }, detail: (e) => `${e.state}%`,
  },
  {
    entity: Entity.BABYSITTER_NEEDED_LIST,
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
  {
    entity: Entity.CARA_CATSITTER_NEEDED_LIST,
    level: 'catsit',
    title: 'Oppas voor Cara',
    icon: 'cat',
    when: (catsitList) => Number(catsitList.state) > 0,
    detail: (catsitList) => {
      const openAppointments = Number(catsitList.state);
      const appointmentsNeedAttention = openAppointments === 1 ? 'afspraak vraagt' : 'afspraken vragen';

      return `${openAppointments} ${appointmentsNeedAttention} aandacht`;
    },
    sheet: CatsitSheet,
  },
];
