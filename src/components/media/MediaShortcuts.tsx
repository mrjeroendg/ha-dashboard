import { useEffect, useMemo, useState } from 'react';
import { MEDIA, type App } from '../../config/media';
import { useStationStart } from '../../hooks/useStationStart';
import { dotFor } from '../../lib/dots';
import { haptic } from '../../lib/haptic';
import { streamButtons, type MediaDevice } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { Icon } from '../Icon';

interface Props {
  hass: HomeAssistant;
  device: MediaDevice;
  onDeviceChange(device: MediaDevice): void;
}

const SWITCH: Array<{ device: MediaDevice; icon: 'speaker' | 'tv'; label: string }> = [
  { device: 'sonos', icon: 'speaker', label: 'Sonos' },
  { device: 'chromecast', icon: 'tv', label: 'TV' },
];

/**
 * The media shortcuts on top of the navigation (docs/design/media-dock): a
 * Sonos | TV switch, then that device's shortcuts, scrolling sideways. Only a
 * tap on the switch changes the device; swiping only scrolls the shortcuts.
 */
export function MediaShortcuts({ hass, device, onDeviceChange }: Props) {
  const sonos = hass.states[MEDIA.sonos.entity];
  const stationStart = useStationStart(hass, sonos);
  const stations = useMemo(() => streamButtons(MEDIA.sonos.stations, hass.states), [hass.states]);
  const apps = device === 'sonos' ? MEDIA.sonos.apps : MEDIA.chromecast.apps;
  const isStartingStation = stationStart.startingScript !== undefined;
  // Tints the fade next to the switch, only once something scrolled behind it.
  const [isScrolled, setIsScrolled] = useState(false);
  // Another device's shortcuts start at the left, also when the switch follows the player.
  useEffect(() => setIsScrolled(false), [device]);

  return (
    <div className={`media-shortcuts${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="media-shortcuts__switch" role="group" aria-label="Toestel">
        {SWITCH.map((option) => (
          <button
            key={option.device}
            type="button"
            aria-label={option.label}
            aria-pressed={option.device === device}
            onClick={() => {
              haptic('selection');
              onDeviceChange(option.device);
            }}
          >
            <Icon name={option.icon} />
          </button>
        ))}
      </div>
      {/* A new key per device starts the shortcuts at the left again. */}
      <div
        key={device}
        className="media-shortcuts__list"
        onScroll={(scrollEvent) => setIsScrolled(scrollEvent.currentTarget.scrollLeft > 0)}
      >
        {apps.map((app) => (
          <AppShortcut key={app.url} app={app} />
        ))}
        {device === 'sonos' &&
          stations.map((station) => {
            const isStarting = stationStart.startingScript === station.script;
            const hasFailed = stationStart.failedScript === station.script;

            return (
              <button
                key={station.script}
                type="button"
                className="media-shortcut"
                disabled={isStartingStation && !isStarting}
                aria-busy={isStarting}
                onClick={() => {
                  haptic('light');
                  stationStart.start(station.script);
                }}
              >
                {isStarting ? (
                  <span className="media-shortcut__dot media-shortcut__dot--busy" aria-hidden>
                    <span className="spinner" />
                  </span>
                ) : (
                  <span className="media-shortcut__dot" style={{ background: station.color && dotFor(station.color) }} aria-hidden />
                )}
                <span className={hasFailed ? 'is-error' : undefined}>{hasFailed ? 'Dat lukte niet' : station.label}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}

/** Opens the app on the iPhone, the same way HA's own "url" tap action does. */
function AppShortcut({ app }: { app: App }) {
  return (
    <button
      type="button"
      className="media-shortcut"
      onClick={() => {
        haptic('light');
        window.open(app.url);
      }}
    >
      <span className="media-shortcut__dot" style={{ background: app.color && dotFor(app.color) }} aria-hidden />
      <span>{app.name}</span>
    </button>
  );
}
