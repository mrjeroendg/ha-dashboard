import type { HassEntity } from 'home-assistant-js-websocket';
import type { MowerConfig } from '../config/rooms';
import {
  chosenMowerControl,
  controlMower,
  mowerControls,
  mowerSheetDetail,
  mowerStatus,
  mowerStatusLines,
  mowerUpkeepLines,
  type MowerListLine,
} from '../lib/mower';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { ChoiceRow } from './ChoiceRow';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
  mower: HassEntity;
  config: MowerConfig;
  onClose(): void;
}

/**
 * Lawn mower sheet (docs/design/lawn-mower): her state as the title, then
 * Bediening as a row of buttons (like the airco sheet), then Status (with the
 * active zone) and Onderhoud as lists (like Veiligheid). At most 80% of the screen; the content
 * scrolls under the handle.
 */
export function MowerSheet({ hass, mower, config, onClose }: Props) {
  const mowerName = String(mower.attributes.friendly_name ?? 'Maaier');
  const status = mowerStatus(mower, config, hass.states);
  const statusLines = mowerStatusLines(config, hass.states);
  const upkeepLines = mowerUpkeepLines(config, hass.states);

  return (
    <BottomSheet
      label={mowerName}
      className="mower-sheet"
      besideHandle={<span className="mower-sheet__name">{mowerName}</span>}
      onClose={onClose}
    >
      <div className="mower-sheet__content">
        <h2 className="mower-sheet__title">{status.title}</h2>
        <p className="mower-sheet__detail">
          {status.isError && <span className="safety-dot is-high" aria-hidden />}
          {mowerSheetDetail(mower, config, hass.states)}
        </p>
        <ChoiceRow
          title="Bediening"
          options={mowerControls(mower)}
          chosenValue={chosenMowerControl(mower)}
          onChoose={(chosenControl) => controlMower(hass, mower, chosenControl)}
        />
        <MowerList title="Status" lines={statusLines} />
        <MowerList title="Onderhoud" lines={upkeepLines} />
      </div>
    </BottomSheet>
  );
}

/** A list in the Veiligheid style; hidden when none of its entities is configured. */
function MowerList({ title, lines }: { title: string; lines: MowerListLine[] }) {
  if (lines.length === 0) return null;

  return (
    <>
      <h3 className="safety-sheet__section">{title}</h3>
      <ul className="safety-list">
        {lines.map((line) => (
          <li key={line.name} className="safety-list__row">
            <Icon name={line.icon} />
            <span className="safety-list__name">{line.name}</span>
            <span className={`safety-list__state${line.needsAttention ? ' is-high' : ''}`}>
              {line.needsAttention && <span className="safety-dot is-high" aria-hidden />}
              {line.value}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
