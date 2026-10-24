import type { HassEntity } from 'home-assistant-js-websocket';
import Wheel from '@uiw/react-color-wheel';
import { useEffect, useRef, useState } from 'react';
import { usePager } from '../hooks/usePager';
import { useControlValue } from '../hooks/useControlValue';
import { haptic } from '../lib/haptic';
import {
  canSetBrightness,
  canSetColor,
  canSetWarmth,
  currentBrightnessPercentage,
  currentHueSaturation,
  currentKelvin,
  setBrightness,
  setHueSaturation,
  setWarmth,
  warmthName,
  warmthRange,
  type HueSaturation,
  type LightMember,
} from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';
import { VerticalSlider } from './VerticalSlider';

interface Props {
  hass: HomeAssistant;
  name: string;
  members: LightMember[];
  onClose(): void;
}

const BRIGHTNESS_TRACK = 'rgba(245, 244, 239, 0.08)';
const BRIGHTNESS_FILL = 'linear-gradient(to top, #ffb36b, #ffd3a3)';
const WARMTH_TRACK = 'linear-gradient(to top, #ffb46b, #ffe4ce 50%, #dfe8ff)';

/** HA stores brightness as 0–255, so the percentage it reports back can be 1% off. */
const ALLOWED_BRIGHTNESS_DIFFERENCE_BETWEEN_APP_AND_HASS = 1;
/** HA stores the warmth in mireds, so the kelvin it reports back is rarely exactly what was sent. */
const ALLOWED_KELVIN_DIFFERENCE_BETWEEN_APP_AND_HASS = 60;
/** HA converts the colour to the light's own colour space (xy) and back, so hue and saturation drift a little. */
const ALLOWED_HUE_DIFFERENCE_BETWEEN_APP_AND_HASS = 3;
const ALLOWED_SATURATION_DIFFERENCE_BETWEEN_APP_AND_HASS = 3;

const COLOR_WHEEL_SIZE = 280;

const isNumberDifferenceMarginal = (allowedDifferenceBetweenAppAndHass: number) => (valueFromEntity: number, valueInApp: number) => {
  const differenceAppAndHass = Math.abs(valueFromEntity - valueInApp);

  return differenceAppAndHass <= allowedDifferenceBetweenAppAndHass;
};

const isColorDifferenceMarginal = (colorFromEntity: HueSaturation, colorInApp: HueSaturation) => {
  const hueDistance = Math.abs(colorFromEntity.hue - colorInApp.hue);
  // Hue goes round: 359° and 1° are 2° apart.
  const hueDifferenceAppAndHass = Math.min(hueDistance, 360 - hueDistance);
  const saturationDifferenceAppAndHass = Math.abs(colorFromEntity.saturation - colorInApp.saturation);
  const isHueMarginal = hueDifferenceAppAndHass <= ALLOWED_HUE_DIFFERENCE_BETWEEN_APP_AND_HASS;
  const isSaturationMarginal = saturationDifferenceAppAndHass <= ALLOWED_SATURATION_DIFFERENCE_BETWEEN_APP_AND_HASS;

  return isHueMarginal && isSaturationMarginal;
};

type LightPageId = 'brightness' | 'warmth' | 'color';

interface LightPage {
  id: LightPageId;
  title: string;
  canControl(light: HassEntity): boolean;
}

/** In this order; a page only shows when at least one pill's light can use it. */
const LIGHT_PAGES: LightPage[] = [
  { id: 'brightness', title: 'Helderheid', canControl: canSetBrightness },
  { id: 'warmth', title: 'Warmte', canControl: canSetWarmth },
  { id: 'color', title: 'Kleur', canControl: canSetColor },
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
  const pageInView = Math.min(pager.page, availablePages.length - 1);

  // The light's name sits small in front of the page dots (option B); the title is the page.
  const nameAndPageDots = (
    <div className="light-sheet__name-and-dots">
      <span className="light-sheet__light-name">{name}</span>
      {availablePages.length > 1 &&
        availablePages.map((page, pageIndex) => (
          <i key={page.id} className={pageInView === pageIndex ? 'is-active' : undefined} aria-hidden />
        ))}
    </div>
  );

  return (
    <BottomSheet label={name} className="light-sheet" besideHandle={nameAndPageDots} onClose={onClose}>
      {/* The page in view; it changes as you swipe. */}
      <h2 className="light-sheet__title">{availablePages[pageInView]?.title}</h2>
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
              {/* A new key per light: each light starts from its own value. */}
              {page.id === 'brightness' && (
                <BrightnessControl key={memberOnPage.entity.entity_id} hass={hass} light={memberOnPage.entity} />
              )}
              {page.id === 'warmth' && (
                <WarmthControl key={memberOnPage.entity.entity_id} hass={hass} light={memberOnPage.entity} />
              )}
              {page.id === 'color' && (
                <ColorControl key={memberOnPage.entity.entity_id} hass={hass} light={memberOnPage.entity} />
              )}
            </div>
          );
        })}
      </div>
    </BottomSheet>
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
  const brightnessSlider = useControlValue(
    currentBrightnessPercentage(light),
    isNumberDifferenceMarginal(ALLOWED_BRIGHTNESS_DIFFERENCE_BETWEEN_APP_AND_HASS),
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
  const kelvinSlider = useControlValue(
    currentKelvin(light),
    isNumberDifferenceMarginal(ALLOWED_KELVIN_DIFFERENCE_BETWEEN_APP_AND_HASS),
  );
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

function ColorControl({ hass, light }: { hass: HomeAssistant; light: HassEntity }) {
  const colorWheel = useControlValue(currentHueSaturation(light), isColorDifferenceMarginal);
  const colorInApp = colorWheel.currentValueInApp;
  // The wheel reports every move but not the release, so the latest colour is kept here for that moment.
  const latestDraggedColor = useRef<HueSaturation | undefined>(undefined);

  const sendColorOnRelease = () => {
    const releasedColor = latestDraggedColor.current;
    latestDraggedColor.current = undefined;
    if (!releasedColor) return;

    colorWheel.keepAfterRelease(releasedColor);
    setHueSaturation(hass, light, releasedColor).catch((error) => {
      console.error(error);
      colorWheel.showValueFromEntity();
    });
  };

  // Listen for the release on the whole window: the finger may end up outside the wheel.
  useEffect(() => {
    window.addEventListener('pointerup', sendColorOnRelease);
    window.addEventListener('pointercancel', sendColorOnRelease);
    return () => {
      window.removeEventListener('pointerup', sendColorOnRelease);
      window.removeEventListener('pointercancel', sendColorOnRelease);
    };
  });

  return (
    <div className="light-control">
      <Wheel
        className="light-color-wheel"
        width={COLOR_WHEEL_SIZE}
        height={COLOR_WHEEL_SIZE}
        direction="clockwise"
        angle={0}
        color={colorInApp ? { h: colorInApp.hue, s: colorInApp.saturation, v: 100, a: 1 } : undefined}
        pointer={({ style, color: pointerColor }) =>
          colorInApp ? (
            <div style={style}>
              <span className="light-color-wheel__knob" style={{ background: pointerColor }} />
            </div>
          ) : (
            <span />
          )
        }
        onChange={(changedColor) => {
          const draggedColor = { hue: changedColor.hsva.h, saturation: changedColor.hsva.s };
          latestDraggedColor.current = draggedColor;
          colorWheel.showWhileDragging(draggedColor);
        }}
      />
    </div>
  );
}
