import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { haptic } from '../lib/haptic';
import {
  canSetWarmth,
  currentKelvin,
  setWarmth,
  warmthName,
  warmthRange,
  type LightMember,
} from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { VerticalSlider } from './VerticalSlider';

interface Props {
  hass: HomeAssistant;
  name: string;
  members: LightMember[];
  onClose(): void;
}

/** How far you have to drag the handle down before the sheet closes. */
const CLOSE_DISTANCE = 90;

const WARMTH_TRACK = 'linear-gradient(to top, #ffb46b, #ffe4ce 50%, #dfe8ff)';

/**
 * Light sheet (docs/design/light-sheet), first step: only the Warmte page.
 * The pills come from `members` in the config; a pill that can't set the
 * warmth is dimmed, and the first one that can is selected.
 */
export function LightSheet({ hass, name, members, onClose }: Props) {
  const usable = members.map((m) => canSetWarmth(m.entity, hass.states));
  const [chosen, setChosen] = useState(() => usable.indexOf(true));
  const member = chosen >= 0 ? members[chosen] : undefined;

  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragStart.current !== null) setDrag(Math.max(0, e.clientY - dragStart.current));
  };
  const onPointerUp = () => {
    const distance = drag;
    dragStart.current = null;
    setDrag(0);
    if (distance > CLOSE_DISTANCE) onClose();
  };

  return (
    <>
      <div className="light-backdrop" onClick={onClose} />
      <div
        className={`light-sheet${drag ? ' is-dragging' : ''}`}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        role="dialog"
        aria-label={name}
      >
        <div
          className="light-sheet__grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="xp__handle" />
        </div>
        <h2 className="light-sheet__title">{name}</h2>
        <div className="light-pills">
          {members.map((m, i) => (
            <button
              key={m.entity.entity_id}
              type="button"
              className="light-pill"
              aria-pressed={i === chosen}
              disabled={!usable[i]}
              onClick={() => {
                haptic('selection');
                setChosen(i);
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
        <h3 className="light-sheet__page">Warmte</h3>
        {/* A new key per pill: each light gets its own draft. */}
        <WarmthControl key={member?.entity.entity_id ?? 'none'} hass={hass} member={member} />
      </div>
    </>
  );
}

function WarmthControl({ hass, member }: { hass: HomeAssistant; member?: LightMember }) {
  const range = member ? warmthRange(member.entity, hass.states) : { min: 2700, max: 6500 };
  const reported = member ? currentKelvin(member.entity) : undefined;
  // One value for the knob: your finger while you drag, otherwise what HA reports.
  const [kelvin, setKelvin] = useState(reported);
  const dragging = useRef(false);

  // HA reports a different kelvin: follow it, unless your finger is on the slider.
  useEffect(() => {
    if (!dragging.current) setKelvin(reported);
  }, [reported]);

  const drag = (k: number) => {
    dragging.current = true;
    setKelvin(k);
  };
  // On release the knob keeps your value until HA reports a different one.
  const release = (k: number) => {
    dragging.current = false;
    setKelvin(k);
    if (!member) return;
    setWarmth(hass, member.entity, k).catch((err) => {
      console.error(err);
      setKelvin(reported);
    });
  };

  return (
    <div className="light-warmth">
      <div className="light-warmth__ends" aria-hidden>
        <span>Koel</span>
        <span>Warm</span>
      </div>
      <VerticalSlider
        value={kelvin}
        min={range.min}
        max={range.max}
        step={50}
        label="Warmte"
        disabled={!member}
        background={WARMTH_TRACK}
        onInput={drag}
        onCommit={release}
      />
      <div className="light-warmth__value">
        {kelvin !== undefined && (
          <>
            <span className="light-warmth__kelvin">{Math.round(kelvin)} K</span>
            <span className="light-warmth__name">{warmthName(kelvin)}</span>
          </>
        )}
      </div>
    </div>
  );
}
