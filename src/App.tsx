import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { MiniPlayer } from './components/media/MiniPlayer';
import { QuickActions } from './components/QuickActions';
import { RoomView } from './components/RoomView';
import { ROOMS } from './config/rooms';
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

  // Every page starts at the top, like switching tabs in an iOS app.
  useEffect(() => {
    top.current?.scrollIntoView({ block: 'start' });
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
      <div className="dock">
        {/* The mini player only lives on Thuis. */}
        {hass && !room && <MiniPlayer hass={hass} />}
        {rooms.length > 0 && <BottomNav rooms={rooms} active={room ? room.id : null} onSelect={setRoomId} />}
      </div>
    </main>
  );
}
