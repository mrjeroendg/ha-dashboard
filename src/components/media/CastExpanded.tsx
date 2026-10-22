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
      {image ? (
        // A video thumbnail is wide: it fills the image area.
        <div className="xp-image">
          <img className="xp-image__fill" src={image} alt="" />
        </div>
      ) : (
        // No thumbnail: the same square-on-blur as the Sonos page, in the Chromecast colours.
        <div className="xp-image xp-image--cover">
          <span className="xp-image__blur media-fade media-fade--cast" aria-hidden />
          <span className="xp-image__square media-fade media-fade--cast" aria-hidden />
        </div>
      )}

      {/* Title with the cast app below it (no episode or TV name). */}
      <TitleBlock
        title={casting ? String(player.attributes.media_title ?? name) : 'Chromecast'}
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
