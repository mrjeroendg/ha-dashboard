import { useState } from 'react';
import { SHORTCUTS } from '../config/shortcuts';
import { usePager } from '../hooks/usePager';
import { useRunAction } from '../hooks/useRunAction';
import { haptic } from '../lib/haptic';
import { resolveRows, rowModel, type Row } from '../lib/rooms';
import type { HomeAssistant } from '../types/hass';
import { BottomSheet } from './BottomSheet';
import { EntityControl } from './EntityControl';
import { Icon } from './Icon';

interface Props {
  hass: HomeAssistant;
}

const SHORTCUTS_PER_PAGE = 5;
const PAGES_ON_THUIS = 2;
const MOST_ON_THUIS = SHORTCUTS_PER_PAGE * PAGES_ON_THUIS;

const SHORTCUTS_ON_THUIS = SHORTCUTS.filter((shortcut) => shortcut.onThuis);
if (SHORTCUTS_ON_THUIS.length > MOST_ON_THUIS) {
  console.warn(`Snel: ${SHORTCUTS_ON_THUIS.length} shortcuts have onThuis, only the first ${MOST_ON_THUIS} fit on Thuis. The rest are in "Alle".`);
}

/** The row on Thuis in pages of five: [[1, 2, 3, 4, 5], [6, 7]]. */
function inPages(shortcutRows: Row[]): Row[][] {
  const pageNumbers = Array.from({ length: Math.ceil(shortcutRows.length / SHORTCUTS_PER_PAGE) }, (_unused, pageNumber) => pageNumber);
  return pageNumbers.map((pageNumber) => shortcutRows.slice(pageNumber * SHORTCUTS_PER_PAGE, (pageNumber + 1) * SHORTCUTS_PER_PAGE));
}

/**
 * "Snel" on Thuis (docs/design/snel-dock): the shortcuts with `onThuis` as
 * small icons in one glass card, five per page. Swiping moves one whole page.
 * "Alle" opens a sheet with every shortcut in src/config/shortcuts.ts, each as
 * the same control as in a room.
 */
export function QuickActions({ hass }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pager = usePager();
  const allShortcuts = resolveRows(SHORTCUTS, hass.states);
  const shortcutsOnThuis = resolveRows(SHORTCUTS_ON_THUIS, hass.states).slice(0, MOST_ON_THUIS);
  const pages = inPages(shortcutsOnThuis);
  if (allShortcuts.length === 0) return null;

  const openAll = () => {
    haptic('selection');
    setIsSheetOpen(true);
  };

  return (
    <section>
      <div className="snel__head">
        <h2 className="section-title">Snel</h2>
        <button type="button" className="snel__all" onClick={openAll}>
          Alle {allShortcuts.length}
          <Icon name="chevron" />
        </button>
      </div>
      {pages.length > 0 && (
        <div className="snel-dock">
          <div className="snel-dock__window" ref={pager.ref} onScroll={pager.onScroll}>
            {pages.map((page, pageNumber) => (
              <div key={pageNumber} className="snel-dock__page">
                {page.map((shortcutRow) => (
                  <ShortcutTile key={shortcutRow.entity.entity_id} hass={hass} shortcutRow={shortcutRow} onOpenAll={openAll} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {pages.length > 1 && (
        <div className="page-dots page-dots--small" aria-hidden>
          {pages.map((_page, pageNumber) => (
            <i key={pageNumber} className={pager.page === pageNumber ? 'is-active' : undefined} />
          ))}
        </div>
      )}
      {isSheetOpen && (
        <BottomSheet label="Snel" className="snel-sheet" onClose={() => setIsSheetOpen(false)}>
          <h2 className="snel-sheet__title">Snel</h2>
          <div className="row-group row-group--slim">
            {allShortcuts.map((shortcutRow) => (
              <EntityControl
                key={shortcutRow.entity.entity_id}
                entity={shortcutRow.entity}
                name={shortcutRow.name}
                icon={shortcutRow.icon}
                options={{ allowUnknownState: shortcutRow.allowUnknownState, simple: shortcutRow.simple }}
                myPosition={shortcutRow.myPosition}
                members={shortcutRow.members}
                look="slim"
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
  onOpenAll(): void;
}

/**
 * One shortcut on Thuis: its icon, orange while it's on, and its name. A tap
 * does its control's main thing: start a scene or script, switch a light or
 * switch. Anything else (a cover, an airco) opens "Alle", where its full
 * control is.
 */
function ShortcutTile({ hass, shortcutRow, onOpenAll }: ShortcutTileProps) {
  const model = rowModel(shortcutRow.entity, { allowUnknownState: shortcutRow.allowUnknownState, simple: shortcutRow.simple });
  const [status, run] = useRunAction();
  const runShortcut = model.run;
  const canRunDirectly = (model.kind === 'toggle' || model.kind === 'action') && runShortcut !== undefined;

  const onTap = () => {
    if (!canRunDirectly) {
      onOpenAll();
      return;
    }
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
