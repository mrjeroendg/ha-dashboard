import { Entity } from './entities';

/** A camera on Thuis (docs/design/cameras): its entity, and the name on its tile and page. */
export interface Camera {
  entity: Entity;
  name: string;
}

/**
 * In this order on Thuis; the first one gets the large tile. For now only the
 * back door; the garage and the side path follow once their entities are known.
 */
export const CAMERAS: Camera[] = [{ entity: Entity.BACK_DOOR_CAMERA, name: 'Achterdeur' }];
