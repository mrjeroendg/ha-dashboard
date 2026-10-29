import type { HassEntities } from 'home-assistant-js-websocket';
import { useState } from 'react';
import { SHORTCUTS, type SnelShortcut } from '../config/shortcuts';
import { usePager } from '../hooks/usePager';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import { resolveRows, rowModel, type Row } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { EntityControl } from './EntityControl';
import { Icon, type IconName } from './Icon';

interface Props {
  hass: HomeAssistant;
}

const SHORTCUTS_PER_PAGE = 5;

/** A shortcut whose entities exist in HA: one entity, or a sheet with the ones that exist. */
type ResolvedShortcut =
  | { kind: 'entity'; key: string; row: Row }
  | { kind: 'sheet'; key: string; name: string; icon: IconName; rows: Row[] };

/** The shortcut with its entities from HA, or nothing when none of them exist. */
function resolveShortcut(shortcut: SnelShortcut, states: HassEntities): ResolvedShortcut | undefined {
  if ('sheet' in shortcut) {
    const sheetRows = resolveRows(shortcut.sheet, states);
    const hasAnyEntity = sheetRows.length > 0;

    return hasAnyEntity ? { kind: 'sheet', key: shortcut.name, name: shortcut.name, icon: shortcut.icon, rows: sheetRows } : undefined;
  }
  const [entityRow] = resolveRows([shortcut], states);
  return entityRow && { kind: 'entity', key: entityRow.entity.entity_id, row: entityRow };
}

/** The shortcuts in pages of five: [[1, 2, 3, 4, 5], [6, 7]]. */
function inPages<T>(shortcuts: T[]): T[][] {
  const pageNumbers = Array.from({ length: Math.ceil(shortcuts.length / SHORTCUTS_PER_PAGE) }, (_unused, pageNumber) => pageNumber);
  return pageNumbers.map((pageNumber) => shortcuts.slice(pageNumber * SHORTCUTS_PER_PAGE, (pageNumber + 1) * SHORTCUTS_PER_PAGE));
}

/**
 * "Snel" on Thuis (docs/design/snel-dock): every shortcut in
 * src/config/shortcuts.ts as a small icon in one glass card, five per page.
 * Swiping moves one whole page. A sheet shortcut opens a sheet with its
 * entities, each as the same control as in a room.
 */
export function QuickActions({ hass }: Props) {
  const [openSheetKey, setOpenSheetKey] = useState<string>();
  const pager = usePager();
  const shortcuts = SHORTCUTS.map((shortcut) => resolveShortcut(shortcut, hass.states)).filter((shortcut) => shortcut !== undefined);
  const pages = inPages(shortcuts);
  const openSheet = shortcuts.find((shortcut) => shortcut.kind === 'sheet' && shortcut.key === openSheetKey);
  if (shortcuts.length === 0) return null;

  return (
    <section>
      <h2 className="section-title">Snel</h2>
      <div className="snel-dock">
        <div className="snel-dock__window" ref={pager.ref} onScroll={pager.onScroll}>
          {pages.map((page, pageNumber) => (
            <div key={pageNumber} className="snel-dock__page">
              {page.map((shortcut) =>
                shortcut.kind === 'sheet' ? (
                  <SheetTile key={shortcut.key} name={shortcut.name} icon={shortcut.icon} onOpen={() => setOpenSheetKey(shortcut.key)} />
                ) : (
                  <ShortcutTile key={shortcut.key} hass={hass} shortcutRow={shortcut.row} />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      {pages.length > 1 && (
        <div className="page-dots page-dots--small" aria-hidden>
          {pages.map((_page, pageNumber) => (
            <i key={pageNumber} className={pager.page === pageNumber ? 'is-active' : undefined} />
          ))}
        </div>
      )}
      {openSheet?.kind === 'sheet' && (
        <BottomSheet label={openSheet.name} className="snel-sheet" onClose={() => setOpenSheetKey(undefined)}>
          <h2 className="snel-sheet__title">{openSheet.name}</h2>
          <div className="row-group">
            {openSheet.rows.map((sheetRow) => (
              <EntityControl
                key={sheetRow.entity.entity_id}
                entity={sheetRow.entity}
                name={sheetRow.name}
                icon={sheetRow.icon}
                options={{ allowUnknownState: sheetRow.allowUnknownState, simple: sheetRow.simple }}
                myPosition={sheetRow.myPosition}
                members={sheetRow.members}
                hass={hass}
              />
            ))}
          </div>
        </BottomSheet>
      )}
    </section>
  );
}

interface ShortcutTileProps {
  hass: HomeAssistant;
  shortcutRow: Row;
}

/**
 * One entity shortcut: its icon, orange while it's on, and its name. A tap
 * does its control's main thing: start a scene or script, switch a light or
 * switch. Anything else (a cover, an airco) belongs in a sheet shortcut, so a
 * tap does nothing.
 */
function ShortcutTile({ hass, shortcutRow }: ShortcutTileProps) {
  const model = rowModel(shortcutRow.entity, { allowUnknownState: shortcutRow.allowUnknownState, simple: shortcutRow.simple });
  const [status, run] = useRunAction();
  const runShortcut = model.run;
  const canRunDirectly = (model.kind === 'toggle' || model.kind === 'action') && runShortcut !== undefined;

  const onTap = () => {
    if (!canRunDirectly) return;
    haptic('light');
    run(() => runShortcut(hass));
  };

  const isDoneAction = status === 'done' && model.kind === 'action';

  return (
    <button
      type="button"
      className={`snel-tile status-${status}`}
      aria-pressed={model.kind === 'toggle' ? model.on : undefined}
      disabled={status === 'busy'}
      onClick={onTap}
    >
      <span className={`snel-tile__icon${model.on ? ' is-on' : ''}`}>
        {status === 'busy' ? <span className="spinner" aria-hidden /> : <Icon name={isDoneAction ? 'check' : (shortcutRow.icon ?? model.icon)} />}
      </span>
      <span className="snel-tile__name">{status === 'error' ? 'Mislukt' : shortcutRow.name}</span>
    </button>
  );
}

interface SheetTileProps {
  name: string;
  icon: IconName;
  onOpen(): void;
}

/** One sheet shortcut: its icon in an orange ring, and its name. A tap opens its sheet. */
function SheetTile({ name, icon, onOpen }: SheetTileProps) {
  const onTap = () => {
    haptic('selection');
    onOpen();
  };

  return (
    <button type="button" className="snel-tile" aria-haspopup="dialog" onClick={onTap}>
      <span className="snel-tile__icon has-sheet">
        <Icon name={icon} />
      </span>
      <span className="snel-tile__name">{name}</span>
    </button>
  );
}
