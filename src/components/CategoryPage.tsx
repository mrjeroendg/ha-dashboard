import type { Category } from '../config/categories';

interface Props {
  category: Category;
}

/** A category page (docs/design/nav-categories): "Categorie" above its name, like "Kamer" on a room page. Its content follows later. */
export function CategoryPage({ category }: Props) {
  return (
    <header className="header">
      <p className="header__date">Categorie</p>
      <h1 className="header__greeting">{category.name}</h1>
    </header>
  );
}
