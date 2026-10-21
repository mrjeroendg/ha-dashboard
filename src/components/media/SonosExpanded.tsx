import type { HassEntity } from 'home-assistant-js-websocket';
import { useMediaPlayer } from '../../hooks/useMediaPlayer';
import { hasMedia, longSubtitle, nowPlaying } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { Controls, PlayButton, ProgressSlot, SideButton, TitleBlock } from './parts/ExpandedRows';
import { VolumeSlider } from './parts/VolumeSlider';

interface Props {
  hass: HomeAssistant;
  player: HassEntity;
}

/** Sonos page of the expanded player (docs/design/media-card). */
export function SonosExpanded({ hass, player }: Props) {
  const media = useMediaPlayer(hass, player);
  const active = hasMedia(player);
  const title = active ? nowPlaying(player).title : String(player.attributes.friendly_name ?? 'Sonos');
  const subtitle = active ? longSubtitle(player) : 'Niets aan het spelen';

  return (
    <section className="xp-page" aria-label="Sonos">
      {/* Square cover centred on a blurred, darkened copy of itself. */}
      <div className="xp-image xp-image--cover">
        {media.image ? (
          <>
            <img className="xp-image__blur" src={media.image} alt="" />
            <img className="xp-image__square" src={media.image} alt="" />
          </>
        ) : (
          <>
            <span className="xp-image__blur media-fade" aria-hidden />
            <span className="xp-image__square media-fade" aria-hidden />
          </>
        )}
      </div>

      <TitleBlock title={title} subtitle={subtitle} />
      <ProgressSlot media={media} active={active} />

      <Controls>
        <SideButton icon="previous" label="Vorige" enabled={media.can.previous} onClick={media.previous} />
        <PlayButton media={media} active={active} />
        <SideButton icon="next" label="Volgende" enabled={media.can.next} onClick={media.next} />
      </Controls>

      <div className="xp-footer">
        {media.volume !== undefined && <VolumeSlider value={media.volume} onCommit={media.setVolume} />}
      </div>
    </section>
  );
}
