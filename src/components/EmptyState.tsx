import { Icon, type IconName } from './Icon';

/**
 * What a sheet shows when it has nothing to list (docs/design/empty-state):
 * an icon in a small tile, centred, with one short grey line below it.
 * Every sheet that can be empty uses this, each with its own text.
 */
export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} />
      </span>
      <p className="empty-state__text">{text}</p>
    </div>
  );
}
