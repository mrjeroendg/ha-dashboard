import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { MiniPlayer } from './components/media/MiniPlayer';
import { QuickActions } from './components/QuickActions';
import { RoomView } from './components/RoomView';
import { ROOMS } from './config/rooms';
import { useDock } from './hooks/useDock';
import { scrollParent } from './lib/scroll';
import { resolveRooms } from './lib/rooms';
import type { DashboardConfig, HomeAssistant } from './types/hass';

interface Props {
  hass?: HomeAssistant;
  config: DashboardConfig;
}

export function App({ hass, config }: Props) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const top = useRef<HTMLElement>(null);

  const states = hass?.states;
  const rooms = useMemo(() => (states ? resolveRooms(ROOMS, states) : []), [states]);
  const room = rooms.find((r) => r.id === roomId);

  const dock = useRef<HTMLDivElement>(null);
  useDock(top, dock);

  // A new room starts at the top, but only scroll if you'd scrolled down
  // within the dashboard; never on first load (that pushed HA's own top
  // area out of view and made the page jump).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
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
        {hass && room ? (
          <RoomView room={room} hass={hass} states={hass.states} />
        ) : (
          <>
            <Header hass={hass} config={config} />
            {hass && <QuickActions hass={hass} />}
          </>
        )}
      </div>
      <div className="dock" ref={dock}>
        {/* The mini player only lives on Thuis. */}
        {hass && !room && <MiniPlayer hass={hass} />}
        {rooms.length > 0 && <BottomNav rooms={rooms} active={room ? room.id : null} onSelect={setRoomId} />}
      </div>
    </main>
  );
}
