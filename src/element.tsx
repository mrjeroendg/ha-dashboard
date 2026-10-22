import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import styles from './styles.css?inline';
import type { DashboardConfig, HomeAssistant } from './types/hass';

export class HaDashboardElement extends HTMLElement {
  private root?: Root;
  private _hass?: HomeAssistant;
  private _config: DashboardConfig = {};

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this.renderApp();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  setConfig(config: DashboardConfig) {
    this._config = { ...config };
    this.renderApp();
  }

  getCardSize() {
    return 3;
  }

  connectedCallback() {
    if (!this.root) {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = styles;
      const mount = document.createElement('div');
      shadow.append(style, mount);
      this.root = createRoot(mount);
    }
    this.renderApp();
  }

  disconnectedCallback() {
    queueMicrotask(() => {
      if (!this.isConnected && this.root) {
        this.root.unmount();
        this.root = undefined;
        this.shadowRoot?.replaceChildren();
      }
    });
  }

  private renderApp() {
    this.root?.render(
      <StrictMode>
        <App hass={this._hass} config={this._config} />
      </StrictMode>,
    );
  }
}
