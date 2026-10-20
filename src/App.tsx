import { Header } from './components/Header';
import { QuickActions } from './components/QuickActions';
import type { DashboardConfig, HomeAssistant } from './types/hass';

interface Props {
  hass?: HomeAssistant;
  config: DashboardConfig;
}

export function App({ hass, config }: Props) {
  return (
    <main className="dashboard">
      <Header hass={hass} config={config} />
      {hass && <QuickActions hass={hass} />}
    </main>
  );
}
