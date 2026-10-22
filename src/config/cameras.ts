import type { IconName } from '../components/Icon';

export interface CameraAction {
  label: string;
  icon: IconName;
  script: string;
}

export interface Camera {
  entity: string;
  name: string;
  frigate?: string;
  actions: CameraAction[];
}

export const CAMERAS: Camera[] = [
  {
    entity: 'camera.garage',
    name: 'Garage',
    frigate: 'garage',
    actions: [],
  },
  {
    entity: 'camera.achterdeur',
    name: 'Achterdeur',
    actions: [],
  },
  {
    entity: 'camera.zijpad',
    name: 'Zijpad',
    actions: [],
  },
];
