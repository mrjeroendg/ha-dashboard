import type { HassEntity } from 'home-assistant-js-websocket';
import { useState } from 'react';
import type { Entity } from '../../config/entities';
import { useStillImageRefresh } from '../../hooks/useStillImageRefresh';
import { stillImageUrl } from '../../lib/cameras';
import { haptic } from '../../lib/haptic';
import { formatTime } from '../../lib/moment';
import type { HomeAssistant } from '../../types/hass';
import { Icon, type IconName } from '../Icon';
import { CameraSheet } from './CameraSheet';

interface Props {
  hass: HomeAssistant;
  cameraEntity: HassEntity;
  name: string;
  icon: IconName;
}

/**
 * A camera in a room (docs/design/room-camera, option B): the icon, the name
 * and when the still image was fetched, with the still image (16:9) under it,
 * refreshed every 10 s like the tiles on Thuis. A tap opens the same live
 * sheet as on Thuis, with only this camera.
 */
export function CameraRow({ hass, cameraEntity, name, icon }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const refreshStamp = useStillImageRefresh(isSheetOpen);
  const imageUrl = stillImageUrl(hass, cameraEntity, refreshStamp);
  // The entity comes from the room's config, so it's an `Entity`.
  const cameraOnItsOwn = [{ entity: cameraEntity.entity_id as Entity, name }];

  const openSheet = () => {
    haptic('light');
    setIsSheetOpen(true);
  };

  return (
    <div className="row-item">
      <button type="button" className="row camera-row" onClick={openSheet}>
        <span className="icon-tile">
          <Icon name={icon} />
        </span>
        <span className="card-text">
          <span className="row__name">{name}</span>
          <span className="card-detail">Bijgewerkt {formatTime(new Date(refreshStamp))}</span>
        </span>
        <span className="camera-row__image">{imageUrl && <img className="camera-tile__image" src={imageUrl} alt="" />}</span>
      </button>
      {isSheetOpen && <CameraSheet hass={hass} cameras={cameraOnItsOwn} openedCameraNumber={0} onClose={() => setIsSheetOpen(false)} />}
    </div>
  );
}
