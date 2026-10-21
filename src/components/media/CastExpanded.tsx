import type { HassEntity } from 'home-assistant-js-websocket';
import { useMediaPlayer } from '../../hooks/useMediaPlayer';
import { castApp, isCasting } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { Controls, PlayButton, ProgressSlot, SideButton, TitleBlock } from './parts/ExpandedRows';
import { VolumeSlider } from './parts/VolumeSlider';

interface Props {
  hass: HomeAssistant;
  player: HassEntity;
}

/** Chromecast page of the expanded player (docs/design/media-card). */
export function CastExpanded({ hass, player }: Props) {
  const media = useMediaPlayer(hass, player);
  const casting = isCasting(player);
  const name = String(player.attributes.friendly_name ?? 'Chromecast');
  const image = casting ? media.image : undefined;

  return (
    <section className={`xp-page${casting ? '' : ' is-idle'}`} aria-label="Chromecast">
      <div className="xp-image">
        {image ? (
          <img className="xp-image__fill" src={image} alt="" />
        ) : (
          <span className="xp-image__fill media-fade" aria-hidden />
        )}
      </div>

      {/* Title with the cast app below it (no episode or TV name). */}
      <TitleBlock
        title={casting ? String(player.attributes.media_title ?? name) : name}
        subtitle={casting ? castApp(player) : 'Niets aan het casten'}
      />
      <ProgressSlot media={media} active={casting} />

      <Controls>
        <SideButton
          icon="rewind"
          badge="10"
          label="10 seconden terug"
          enabled={media.can.seek}
          hidden={casting && !media.can.seek && !!media.progress}
          onClick={() => media.seekBy(-10)}
        />
        <PlayButton media={media} active={casting} />
        <SideButton
          icon="forward"
          badge="30"
          label="30 seconden vooruit"
          enabled={media.can.seek}
          hidden={casting && !media.can.seek && !!media.progress}
          onClick={() => media.seekBy(30)}
        />
      </Controls>

      <div className="xp-footer">
        {media.volume !== undefined && <VolumeSlider value={media.volume} onCommit={media.setVolume} />}
        {casting && media.can.stop && (
          <button type="button" className="xp-stop" onClick={media.stop}>
            Stop
          </button>
        )}
      </div>
    </section>
  );
}
