import type { Category } from '../config/categories';
import type { HomeAssistant } from '../types/hass';
import { EnergyPage } from './energy/EnergyPage';

interface Props {
  category: Category;
  hass?: HomeAssistant;
}

/** A category page (docs/design/nav-categories): "Categorie" above its name, like "Kamer" on a room page, then its content. */
export function CategoryPage({ category, hass }: Props) {
  return (
    <>
      <header className="header">
        <p className="header__date">Categorie</p>
        <h1 className="header__greeting">{category.name}</h1>
      </header>
      {hass && category.id === 'energie' && <EnergyPage hass={hass} />}
    </>
  );
}
