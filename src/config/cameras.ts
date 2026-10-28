import type { IconName } from '../components/Icon';
import { Entity } from './entities';

export interface CameraAction {
  label: string;
  icon: IconName;
  script: string;
}

export interface Camera {
  entity: Entity;
  name: string;
  frigate?: string;
  actions: CameraAction[];
}

/** For now only the back door; the garage and the side path follow once their entities are known. */
export const CAMERAS: Camera[] = [
  {
    entity: Entity.BACK_DOOR_CAMERA,
    name: 'Achterdeur',
    actions: [],
  },
];
