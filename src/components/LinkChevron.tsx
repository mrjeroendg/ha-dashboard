import { Icon } from './Icon';

/**
 * The small "›" right after a piece of text that opens more (a sheet), the
 * same everywhere on the dashboard (CLAUDE.md): e.g. "Huis vandaag ›", "Piek
 * deze maand ›", and the room's safety line.
 */
export function LinkChevron() {
  return (
    <span className="link-chevron" aria-hidden>
      <Icon name="chevron" />
    </span>
  );
}
