import { useEffect, useLayoutEffect, useState } from 'react';
import { MEDIA } from '../../config/media';
import { useNow } from '../../hooks/useNow';
import { usePager } from '../../hooks/usePager';
import { isCasting, isSonosShown, MEDIA_DEVICES, type MediaDevice } from '../../lib/media';
import type { HomeAssistant } from '../../types/hass';
import { ExpandedPlayer } from './ExpandedPlayer';
import { MiniPlayerPage } from './MiniPlayerPage';

interface Props {
  hass: HomeAssistant;
  /** Reports the device in view, so the shortcuts' switch can follow it. */
  onDeviceInView(device: MediaDevice): void;
}

/**
 * Mini player on Thuis (docs/design/media-dock): only while something plays,
 * one page per playing device, the Sonos first, swiped horizontally and
 * always snapping to a whole page. Tapping a page opens the expanded player
 * on that device; closing it returns to the mini player on the same device.
 */
export function MiniPlayer({ hass, onDeviceInView }: Props) {
  const now = useNow();
  const pager = usePager();
  const [expandedDevice, setExpandedDevice] = useState<MediaDevice | null>(null);
  const [lastDeviceInView, setLastDeviceInView] = useState<MediaDevice>('sonos');

  const sonos = hass.states[MEDIA.sonos.entity];
  const chromecast = hass.states[MEDIA.chromecast.entity];
  const isDeviceShown: Record<MediaDevice, boolean> = {
    sonos: isSonosShown(sonos, now),
    chromecast: isCasting(chromecast),
  };
  const shownDevices = MEDIA_DEVICES.filter((device) => isDeviceShown[device]);
  const pageInView = Math.min(pager.page, shownDevices.length - 1);
  const deviceInView = shownDevices[pageInView];

  // A device that starts playing comes into view: it's what you just started.
  const shownDevicesKey = shownDevices.join(',');
  const [previousShownDevicesKey, setPreviousShownDevicesKey] = useState(shownDevicesKey);
  if (shownDevicesKey !== previousShownDevicesKey) {
    const newlyShownDevice = shownDevices.find((device) => !previousShownDevicesKey.split(',').includes(device));
    setPreviousShownDevicesKey(shownDevicesKey);
    if (newlyShownDevice) setLastDeviceInView(newlyShownDevice);
  }

  // Back from the expanded player, or when the pages change: show the device
  // that was last in view.
  const pageOfLastDevice = Math.max(0, shownDevices.indexOf(lastDeviceInView));
  useLayoutEffect(() => {
    if (expandedDevice === null) pager.jumpTo(pageOfLastDevice);
  }, [expandedDevice, pageOfLastDevice, shownDevicesKey, pager.jumpTo]);

  useEffect(() => {
    if (deviceInView && expandedDevice === null) onDeviceInView(deviceInView);
  }, [deviceInView, expandedDevice, onDeviceInView]);

  // A swipe changes the device to return to, e.g. when another device starts playing.
  const onScroll = () => {
    pager.onScroll();
    const pagesElement = pager.ref.current;
    if (!pagesElement) return;

    const pageAfterSwipe = Math.round(pagesElement.scrollLeft / pagesElement.clientWidth);
    const deviceAfterSwipe = shownDevices[pageAfterSwipe];
    if (deviceAfterSwipe) setLastDeviceInView(deviceAfterSwipe);
  };

  if (expandedDevice !== null) {
    const close = () => setExpandedDevice(null);
    const reportExpandedPage = (page: number) => setLastDeviceInView(MEDIA_DEVICES[page]);

    return (
      <>
        <div className="media-backdrop" onClick={close} />
        <ExpandedPlayer
          hass={hass}
          initialPage={MEDIA_DEVICES.indexOf(expandedDevice)}
          onPageChange={reportExpandedPage}
          onClose={close}
        />
      </>
    );
  }

  if (shownDevices.length === 0) return null;

  const open = (device: MediaDevice) => {
    setLastDeviceInView(device);
    setExpandedDevice(device);
  };
  const hasTwoPages = shownDevices.length === 2;

  return (
    <div className="media-card">
      <div className="media-card__pages" ref={pager.ref} onScroll={onScroll}>
        {shownDevices.map((device) => (
          <div key={device} className="media-card__page">
            <MiniPlayerPage
              hass={hass}
              device={device}
              player={device === 'sonos' ? sonos : chromecast}
              onOpen={() => open(device)}
            />
          </div>
        ))}
      </div>
      {hasTwoPages && (
        <div className="page-dots" aria-hidden>
          <i className={pageInView === 0 ? 'is-active' : undefined} />
          <i className={pageInView === 1 ? 'is-active' : undefined} />
        </div>
      )}
    </div>
  );
}
