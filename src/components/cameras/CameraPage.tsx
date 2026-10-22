import { useEffect, useState } from 'react';
import type { Camera, CameraAction } from '../../config/cameras';
import { useRunAction } from '../../hooks/useRunAction';
import { useTicker } from '../../hooks/useTicker';
import { clock, runCameraAction, todaysEvents, type CameraEvent } from '../../lib/cameras';
import { haptic } from '../../lib/haptic';
import type { HomeAssistant } from '../../types/hass';
import { Icon } from '../Icon';
import { LiveImage } from './LiveImage';

interface Props {
  hass: HomeAssistant;
  camera: Camera;
  /** In view: stream live. Otherwise show the still image. */
  live: boolean;
}

/** One camera in the live sheet: image, name with LIVE, actions, and "Vandaag". */
export function CameraPage({ hass, camera, live }: Props) {
  const now = useTicker(live);

  return (
    <div className="camera-page">
      <div className="camera-live">
        <LiveImage hass={hass} entity={hass.states[camera.entity]} live={live} />
        <span className="camera-time">{clock(new Date(now), true)}</span>
      </div>
      <div className="camera-page__header">
        <h2 className="camera-page__name">{camera.name}</h2>
        <span className="camera-live-pill">Live</span>
      </div>
      {camera.actions.length > 0 && (
        <div className="camera-actions">
          {camera.actions.map((action) => (
            <ActionButton key={action.script} hass={hass} action={action} />
          ))}
        </div>
      )}
      <h3 className="camera-page__section">Vandaag</h3>
      {camera.frigate ? (
        <Events hass={hass} camera={camera} frigate={camera.frigate} />
      ) : (
        <Placeholder text={`${camera.name} houdt geen gebeurtenissen bij. Live kijken kan wel.`} />
      )}
    </div>
  );
}

/** Fire and forget: spinner while it runs, then ✓ or "Dat lukte niet". */
function ActionButton({ hass, action }: { hass: HomeAssistant; action: CameraAction }) {
  const [status, run] = useRunAction();

  return (
    <button
      type="button"
      className={`camera-action status-${status}`}
      disabled={status === 'busy'}
      onClick={() => {
        haptic('light');
        run(() => runCameraAction(hass, action.script));
      }}
    >
      {status === 'busy' ? (
        <span className="spinner" aria-hidden />
      ) : (
        <Icon name={status === 'done' ? 'check' : action.icon} />
      )}
      {status === 'error' ? 'Dat lukte niet' : action.label}
    </button>
  );
}

function Events({ hass, camera, frigate }: { hass: HomeAssistant; camera: Camera; frigate: string }) {
  const [events, setEvents] = useState<CameraEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    todaysEvents(hass, frigate)
      .then((list) => !cancelled && setEvents(list))
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // Load once per opening; hass changes on every state update.
  }, [frigate]);

  if (failed) return <Placeholder text="Frigate is niet bereikbaar." />;
  if (!events) return null;
  if (events.length === 0) return <Placeholder text="Nog niets gebeurd vandaag." />;

  return (
    <ul className="camera-events">
      {events.map((e) => (
        <li key={e.id} className="camera-event">
          {e.thumbnail ? <img className="camera-event__thumb" src={e.thumbnail} alt="" /> : <span className="camera-event__thumb" />}
          <span className="camera-event__text">
            <span className="camera-event__label">{e.label}</span>
            <span className="camera-event__camera">{camera.name}</span>
          </span>
          <span className="camera-event__time">{e.time}</span>
        </li>
      ))}
    </ul>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="camera-placeholder">
      <span className="camera-placeholder__icon">
        <Icon name="cameraOff" />
      </span>
      <b>Geen opnames</b>
      <span>{text}</span>
    </div>
  );
}
