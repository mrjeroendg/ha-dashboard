import type { ReactNode } from 'react';
import type { useMediaPlayer } from '../../../hooks/useMediaPlayer';
import { formatDuration } from '../../../lib/media';
import { Icon } from '../../Icon';
import { LivePill, ProgressTrack } from './Progress';

type Media = ReturnType<typeof useMediaPlayer>;

/** Title (serif) with an optional muted line below. Fixed minimum height. */
export function TitleBlock({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="xp-title">
      <span className="xp-title__main">{title}</span>
      {subtitle && <span className="xp-title__sub">{subtitle}</span>}
    </div>
  );
}

/** Progress bar with times, or the LIVE pill when there is no duration. */
export function ProgressSlot({ media, active }: { media: Media; active: boolean }) {
  const p = active ? media.progress : undefined;
  return (
    <div className="xp-progress">
      {active && !p ? (
        <LivePill large />
      ) : (
        <>
          <ProgressTrack fraction={p ? p.position / p.duration : 0} knob={!!p} />
          <div className="xp-progress__times">
            <span>{p ? formatDuration(p.position) : ''}</span>
            <span>{p ? `−${formatDuration(p.duration - p.position)}` : ''}</span>
          </div>
        </>
      )}
    </div>
  );
}

/** The 60px accent play/pause button, always in the same place. */
export function PlayButton({ media, active }: { media: Media; active: boolean }) {
  return (
    <button
      type="button"
      className="xp-play"
      disabled={!active}
      aria-label={media.playing ? 'Pauzeren' : 'Afspelen'}
      onClick={media.playPause}
    >
      <Icon name={media.playing ? 'pause' : 'play'} />
    </button>
  );
}

interface SideButtonProps {
  icon: 'previous' | 'next' | 'rewind' | 'forward';
  label: string;
  enabled: boolean;
  /** Small number in the icon, e.g. 10 / 30 for seeking. */
  badge?: string;
  /** Hidden but still taking its space, so the play button never moves. */
  hidden?: boolean;
  onClick(): void;
}

export function SideButton({ icon, label, enabled, badge, hidden, onClick }: SideButtonProps) {
  return (
    <button
      type="button"
      className="xp-side"
      style={hidden ? { visibility: 'hidden' } : undefined}
      disabled={!enabled}
      aria-label={label}
      onClick={onClick}
    >
      <Icon name={icon} />
      {badge && <i>{badge}</i>}
    </button>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="xp-controls">{children}</div>;
}
