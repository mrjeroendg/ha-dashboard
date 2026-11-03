import type { IconName } from '../components/Icon';

/**
 * A category page (docs/design/nav-categories, option A): a page about the
 * whole house rather than one room. In the bottom bar left of Thuis, in this
 * order, with a thin line between them and Thuis.
 *
 * `id` must differ from every room's id in src/config/rooms.ts.
 */
export interface Category {
  id: string;
  name: string;
  icon: IconName;
}

export const CATEGORIES: Category[] = [{ id: 'energie', name: 'Energie', icon: 'bolt' }];
