import { useEffect, useRef, useState } from 'react';
import type { HassEntity } from 'home-assistant-js-websocket';
import type { HomeAssistant } from '../types/hass';

/** How long to wait for the Sonos to start playing after a station shortcut. */
const START_TIMEOUT = 10_000;
/** How long "Dat lukte niet" stays in the shortcut. */
const ERROR_VISIBLE = 3_000;

type Starting = { script: string; mediaBeforeStart: string } | null;

/** What the Sonos is playing, to notice that it switched to the new station. */
const mediaKey = (player?: HassEntity) =>
  player
    ? [player.state, player.attributes.media_channel, player.attributes.media_title, player.attributes.media_content_id].join('|')
    : '';

/**
 * Starts a station's script (fire and forget) and follows it: busy until the
 * Sonos plays something new, failed after 10 s without it (docs/design/media-card).
 */
export function useStationStart(hass: HomeAssistant, sonos: HassEntity | undefined) {
  const [starting, setStarting] = useState<Starting>(null);
  const [failedScript, setFailedScript] = useState<string | null>(null);
  const startTimer = useRef<number | undefined>(undefined);
  const errorTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(startTimer.current);
      window.clearTimeout(errorTimer.current);
    },
    [],
  );

  // Done as soon as the Sonos plays something new.
  useEffect(() => {
    const isPlayingSomethingNew = sonos?.state === 'playing' && mediaKey(sonos) !== starting?.mediaBeforeStart;

    if (starting && isPlayingSomethingNew) {
      window.clearTimeout(startTimer.current);
      setStarting(null);
    }
  }, [sonos, starting]);

  const fail = (script: string) => {
    window.clearTimeout(startTimer.current);
    setStarting(null);
    setFailedScript(script);
    window.clearTimeout(errorTimer.current);
    errorTimer.current = window.setTimeout(() => setFailedScript(null), ERROR_VISIBLE);
  };

  const start = (script: string) => {
    if (starting) return;
    setFailedScript(null);
    setStarting({ script, mediaBeforeStart: mediaKey(sonos) });
    window.clearTimeout(startTimer.current);
    startTimer.current = window.setTimeout(() => fail(script), START_TIMEOUT);
    hass.callService('script', 'turn_on', {}, { entity_id: script }).catch((error) => {
      console.error(error);
      fail(script);
    });
  };

  return { startingScript: starting?.script, failedScript, start };
}
