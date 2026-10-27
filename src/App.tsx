import { useEffect, useMemo, useRef, useState } from 'react';
import { Attention } from './components/Attention';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { MediaShortcuts } from './components/media/MediaShortcuts';
import { MiniPlayer } from './components/media/MiniPlayer';
import { QuickActions } from './components/QuickActions';
import { RoomView } from './components/RoomView';
import { StatisticsSection } from './components/StatisticsSection';
import { STATISTICS } from './config/statistics';
import { ROOMS } from './config/rooms';
import { useDock } from './hooks/useDock';
import { useHiddenPageScrollbar } from './hooks/useHiddenPageScrollbar';
import { scrollParent } from './lib/scroll';
import type { MediaDevice } from './lib/media';
import { resolveRooms } from './lib/rooms';
import type { DashboardConfig, HomeAssistant } from './types/hass';

interface Props {
  hass?: HomeAssistant;
  config: DashboardConfig;
}

export function App({ hass, config }: Props) {
  const [roomId, setRoomId] = useState<string | null>(null);
  // Which way the new page slides in: from the right when you tap a room
  // further along the bar, from the left when you go back. None on first load.
  const [direction, setDirection] = useState<'forward' | 'back' | null>(null);
  const top = useRef<HTMLElement>(null);
  // The device of the media shortcuts; it follows the mini player's page.
  const [mediaDevice, setMediaDevice] = useState<MediaDevice>('sonos');

  const states = hass?.states;
  const rooms = useMemo(() => (states ? resolveRooms(ROOMS, states) : []), [states]);
  const room = rooms.find((r) => r.id === roomId);

  const selectPage = (id: string | null) => {
    if (id === roomId) return;
    const order = [null, ...rooms.map((r) => r.id)];
    setDirection(order.indexOf(id) > order.indexOf(roomId) ? 'forward' : 'back');
    setRoomId(id);
  };

  const dock = useRef<HTMLDivElement>(null);
  useDock(top, dock);
  useHiddenPageScrollbar(top, Boolean(hass));

  // A new page starts at the top: if you'd scrolled down, scroll back up.
  useEffect(() => {
    const el = top.current;
    if (!el) return;
    const scroller = scrollParent(el);
    const isPage = scroller === document.scrollingElement || scroller === document.documentElement;
    const offset = el.getBoundingClientRect().top - (isPage ? 0 : scroller.getBoundingClientRect().top);
    if (offset < 0) scroller.scrollBy({ top: offset });
  }, [roomId]);

  return (
    <main className="dashboard" ref={top}>
      <div className="dashboard__content">
        {/* A new key per page restarts the slide-in animation. */}
        <div key={room?.id ?? 'thuis'} className={direction ? `page page--${direction}` : 'page'}>
          {hass && room ? (
            <RoomView room={room} hass={hass} />
          ) : (
            <>
              <Header hass={hass} config={config} />
              {hass && <Attention hass={hass} />}
              {hass && <QuickActions hass={hass} />}
              {hass && STATISTICS.map((section) => <StatisticsSection key={section.title} hass={hass} section={section} />)}
            </>
          )}
        </div>
      </div>
      <div className="dock" ref={dock}>
        {/* The mini player and the media shortcuts only live on Thuis. */}
        {hass && !room && <MiniPlayer hass={hass} onDeviceInView={setMediaDevice} />}
        {rooms.length > 0 && (
          <BottomNav
            rooms={rooms}
            active={room ? room.id : null}
            onSelect={selectPage}
            top={hass && !room && <MediaShortcuts hass={hass} device={mediaDevice} onDeviceChange={setMediaDevice} />}
          />
        )}
      </div>
    </main>
  );
}
