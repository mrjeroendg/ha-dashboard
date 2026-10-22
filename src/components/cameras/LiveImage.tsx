import type { HassEntity } from 'home-assistant-js-websocket';
import { useEffect, useState } from 'react';
import { canPlayHls, hlsUrl, mjpegUrl, stillUrl } from '../../lib/cameras';
import type { HomeAssistant } from '../../types/hass';

interface Props {
  hass: HomeAssistant;
  entity: HassEntity;
  live: boolean;
}

type Source = { kind: 'hls'; url: string } | { kind: 'mjpeg'; url: string } | { kind: 'still' };

/**
 * The live image. Where the browser plays HLS itself (iPhone, iPad, Safari),
 * HA's HLS stream in a native <video>; otherwise HA's MJPEG stream in an
 * <img>. If both fail, the still image. Not live: the still image, and no
 * stream is open.
 */
export function LiveImage({ hass, entity, live }: Props) {
  const [source, setSource] = useState<Source>({ kind: 'still' });
  const [stamp] = useState(() => Date.now());
  const id = entity.entity_id;

  useEffect(() => {
    if (!live) {
      setSource({ kind: 'still' });
      return;
    }
    let cancelled = false;
    const mjpeg = (): Source => {
      const url = mjpegUrl(hass, entity);
      return url ? { kind: 'mjpeg', url } : { kind: 'still' };
    };
    if (canPlayHls()) {
      hlsUrl(hass, id)
        .then((url) => !cancelled && setSource({ kind: 'hls', url }))
        .catch(() => !cancelled && setSource(mjpeg()));
    } else {
      setSource(mjpeg());
    }
    return () => {
      cancelled = true;
    };
    // A new stream only when the camera or `live` changes, not on every state update.
  }, [id, live]);

  const still = stillUrl(hass, entity, stamp);

  if (source.kind === 'hls') {
    return (
      <video
        className="camera-live__media"
        src={source.url}
        poster={still}
        autoPlay
        muted
        playsInline
        onError={() => setSource({ kind: 'still' })}
      />
    );
  }
  if (source.kind === 'mjpeg') {
    return <img className="camera-live__media" src={source.url} alt="" onError={() => setSource({ kind: 'still' })} />;
  }
  return still ? <img className="camera-live__media" src={still} alt="" /> : null;
}
