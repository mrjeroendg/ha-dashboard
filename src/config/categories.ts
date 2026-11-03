import type { IconName } from '../components/Icon';

/**
 * A category page (docs/design/nav-categories, option A): a page about the
 * whole house rather than one room. In the bottom bar left of Thuis, in this
 * order, with a thin line between them and Thuis.
 *
 * `id` must differ from every room's id in src/config/rooms.ts.
 */
/** Each category's page has its own content (CategoryPage.tsx), so the ids are fixed. */
export type CategoryId = 'energie';

export interface Category {
  id: CategoryId;
  name: string;
  icon: IconName;
}

export const CATEGORIES: Category[] = [{ id: 'energie', name: 'Energie', icon: 'bolt' }];
