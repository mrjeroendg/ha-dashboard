import type { HassEntity } from 'home-assistant-js-websocket';
import { useRef, useState, type PointerEvent } from 'react';
import { usePager } from '../hooks/usePager';
import { useSliderValue } from '../hooks/useSliderValue';
import { haptic } from '../lib/haptic';
import {
  canSetBrightness,
  canSetWarmth,
  currentBrightnessPercentage,
  currentKelvin,
  setBrightness,
  setWarmth,
  warmthName,
  warmthRange,
  type LightMember,
} from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { Icon } from './Icon';
import { VerticalSlider } from './VerticalSlider';

interface Props {
  hass: HomeAssistant;
  name: string;
  members: LightMember[];
  onClose(): void;
}

/** How far you have to drag the handle down before the sheet closes. */
const CLOSE_DISTANCE = 90;

const BRIGHTNESS_TRACK = 'rgba(245, 244, 239, 0.08)';
const BRIGHTNESS_FILL = 'linear-gradient(to top, #ffb36b, #ffd3a3)';
const WARMTH_TRACK = 'linear-gradient(to top, #ffb46b, #ffe4ce 50%, #dfe8ff)';

/** HA stores brightness as 0–255, so the percentage it reports back can be 1% off. */
const ALLOWED_BRIGHTNESS_DIFFERENCE_BETWEEN_APP_AND_HASS = 1;
/** HA stores the warmth in mireds, so the kelvin it reports back is rarely exactly what was sent. */
const ALLOWED_KELVIN_DIFFERENCE_BETWEEN_APP_AND_HASS = 60;

type LightPageId = 'brightness' | 'warmth';

interface LightPage {
  id: LightPageId;
  title: string;
  canControl(light: HassEntity): boolean;
}

/** In this order; a page only shows when at least one pill's light can use it. */
const LIGHT_PAGES: LightPage[] = [
  { id: 'brightness', title: 'Helderheid', canControl: canSetBrightness },
  { id: 'warmth', title: 'Warmte', canControl: canSetWarmth },
];

/**
 * Light sheet (docs/design/light-sheet): one page per thing the lights can do,
 * swiped sideways like the media card. Every page has the same pills (from
 * `members` in the config); a pill whose light can't do that page is dimmed.
 * The chosen pill carries over between pages; where it can't, the page uses
 * the first pill that can.
 */
export function LightSheet({ hass, name, members, onClose }: Props) {
  const pager = usePager();
  const [chosenMemberIndex, setChosenMemberIndex] = useState(0);
  const availablePages = LIGHT_PAGES.filter((page) => members.some((member) => page.canControl(member.entity)));

  const [dragDistance, setDragDistance] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const startDraggingHandle = (pointerEvent: PointerEvent) => {
    dragStartY.current = pointerEvent.clientY;
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  };
  const followHandle = (pointerEvent: PointerEvent) => {
    if (dragStartY.current !== null) setDragDistance(Math.max(0, pointerEvent.clientY - dragStartY.current));
  };
  const releaseHandle = () => {
    const isDraggedFarEnough = dragDistance > CLOSE_DISTANCE;
    dragStartY.current = null;
    setDragDistance(0);
    if (isDraggedFarEnough) onClose();
  };

  return (
    <>
      <div className="light-backdrop" onClick={onClose} />
      <div
        className={`light-sheet${dragDistance ? ' is-dragging' : ''}`}
        style={dragDistance ? { transform: `translateY(${dragDistance}px)` } : undefined}
        role="dialog"
        aria-label={name}
      >
        <div
          className="light-sheet__grab"
          onPointerDown={startDraggingHandle}
          onPointerMove={followHandle}
          onPointerUp={releaseHandle}
          onPointerCancel={releaseHandle}
        >
          <span className="xp__handle" />
          {availablePages.length > 1 && (
            <div className="page-dots page-dots--top" aria-hidden>
              {availablePages.map((page, pageIndex) => (
                <i key={page.id} className={pager.page === pageIndex ? 'is-active' : undefined} />
              ))}
            </div>
          )}
        </div>
        <h2 className="light-sheet__title">{name}</h2>
        <div className="media-card__pages light-sheet__pages" ref={pager.ref} onScroll={pager.onScroll}>
          {availablePages.map((page) => {
            const chosenMemberCanControlPage = page.canControl(members[chosenMemberIndex].entity);
            const firstMemberThatCanControlPage = members.findIndex((member) => page.canControl(member.entity));
            const memberIndexOnPage = chosenMemberCanControlPage ? chosenMemberIndex : firstMemberThatCanControlPage;
            const memberOnPage = members[memberIndexOnPage];

            return (
              <div key={page.id} className="media-card__page light-sheet__page">
                <MemberPills
                  members={members}
                  page={page}
                  selectedMemberIndex={memberIndexOnPage}
                  onSelect={setChosenMemberIndex}
                />
                <h3 className="light-sheet__page-title">{page.title}</h3>
                {/* A new key per light: each light starts from its own value. */}
                {page.id === 'brightness' && (
                  <BrightnessControl key={memberOnPage.entity.entity_id} hass={hass} light={memberOnPage.entity} />
                )}
                {page.id === 'warmth' && (
                  <WarmthControl key={memberOnPage.entity.entity_id} hass={hass} light={memberOnPage.entity} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface MemberPillsProps {
  members: LightMember[];
  page: LightPage;
  selectedMemberIndex: number;
  onSelect(memberIndex: number): void;
}

function MemberPills({ members, page, selectedMemberIndex, onSelect }: MemberPillsProps) {
  return (
    <div className="light-pills">
      {members.map((member, memberIndex) => (
        <button
          key={member.entity.entity_id}
          type="button"
          className="light-pill"
          aria-pressed={memberIndex === selectedMemberIndex}
          disabled={!page.canControl(member.entity)}
          onClick={() => {
            haptic('selection');
            onSelect(memberIndex);
          }}
        >
          {member.name}
        </button>
      ))}
    </div>
  );
}

function BrightnessControl({ hass, light }: { hass: HomeAssistant; light: HassEntity }) {
  const brightnessSlider = useSliderValue(
    currentBrightnessPercentage(light),
    ALLOWED_BRIGHTNESS_DIFFERENCE_BETWEEN_APP_AND_HASS,
  );
  const brightnessInApp = brightnessSlider.currentValueInApp;

  const sendBrightnessOnRelease = (releasedBrightness: number) => {
    brightnessSlider.keepAfterRelease(releasedBrightness);
    setBrightness(hass, light, releasedBrightness).catch((error) => {
      console.error(error);
      brightnessSlider.showValueFromEntity();
    });
  };

  return (
    <div className="light-control">
      {/* Same width as Warmte's "Koel/Warm" column, so the slider sits in the same place on both pages. */}
      <div className="light-control__ends" aria-hidden />
      <VerticalSlider
        look="fill"
        value={brightnessInApp}
        min={1}
        max={100}
        label="Helderheid"
        background={BRIGHTNESS_TRACK}
        fillBackground={BRIGHTNESS_FILL}
        icon={<Icon name="sun" />}
        onInput={brightnessSlider.showWhileDragging}
        onCommit={sendBrightnessOnRelease}
      />
      <div className="light-control__value">
        {brightnessInApp !== undefined && (
          <span className="light-control__number">
            {brightnessInApp}
            <small>%</small>
          </span>
        )}
      </div>
    </div>
  );
}

function WarmthControl({ hass, light }: { hass: HomeAssistant; light: HassEntity }) {
  const kelvinRange = warmthRange(light);
  const kelvinSlider = useSliderValue(currentKelvin(light), ALLOWED_KELVIN_DIFFERENCE_BETWEEN_APP_AND_HASS);
  const kelvinInApp = kelvinSlider.currentValueInApp;

  const sendKelvinOnRelease = (releasedKelvin: number) => {
    kelvinSlider.keepAfterRelease(releasedKelvin);
    setWarmth(hass, light, releasedKelvin).catch((error) => {
      console.error(error);
      kelvinSlider.showValueFromEntity();
    });
  };

  return (
    <div className="light-control">
      <div className="light-control__ends" aria-hidden>
        <span>Koel</span>
        <span>Warm</span>
      </div>
      <VerticalSlider
        look="knob"
        value={kelvinInApp}
        min={kelvinRange.min}
        max={kelvinRange.max}
        step={50}
        label="Warmte"
        background={WARMTH_TRACK}
        onInput={kelvinSlider.showWhileDragging}
        onCommit={sendKelvinOnRelease}
      />
      <div className="light-control__value">
        {kelvinInApp !== undefined && (
          <>
            <span className="light-control__number">{Math.round(kelvinInApp)} K</span>
            <span className="light-control__name">{warmthName(kelvinInApp)}</span>
          </>
        )}
      </div>
    </div>
  );
}
