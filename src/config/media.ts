import type { DotColor } from '../lib/dots';
import { Entity } from './entities';

export interface Station {
  name: string;
  label?: string;
  script: string;
  stream: string;
  color?: DotColor;
}

export interface App {
  name: string;
  url: string;
  color?: DotColor;
}

/**
 * Media on Thuis (docs/design/media-dock): the Sonos comes first. Its apps
 * (Spotify) come before its stations in the shortcut row.
 */
export const MEDIA = {
  sonos: {
    entity: Entity.LIVING_SONOS,
    apps: [{ name: 'Spotify', url: 'spotify://', color: ['#5ef08f', '#1db954', '#0b3d1f'] }] as App[],
    stations: [
      {
        name: 'Radio 1',
        script: Entity.PLAY_RADIO_1_ON_CHROMECAST_SCRIPT,
        stream: 'http://icecast.vrtcdn.be/radio1-high.mp3',
        color: ['#ff4942', '#0068d8', '#002a66'],
      },
      {
        name: 'Studio Brussel',
        label: 'StuBru',
        script: Entity.PLAY_STUDIO_BRUSSEL_ON_CHROMECAST_SCRIPT,
        stream: 'http://icecast.vrtcdn.be/stubru-high.mp3',
        color: ['#ff4942', '#7e31aa', '#331a5c'],
      },
      {
        name: 'Tijdloze',
        script: Entity.PLAY_TIJDLOZE_ON_SONOS_SCRIPT,
        stream: 'http://icecast.vrtcdn.be/stubru_tijdloze-high.mp3',
        color: ['#ff4942', '#c0b06c', '#434540'],
      },
    ] as Station[],
  },
  chromecast: {
    entity: Entity.LIVING_CHROMECAST,
    apps: [
      { name: 'Netflix', url: 'nflx://', color: ['#f0323b', '#e50914', '#141414'] },
      { name: 'VRT', url: 'vrtmax://', color: ['#ff4f55', '#f5333a', '#f5333a', '#1b1d52'] },
      { name: 'VTM', url: 'vtmgo://', color: ['#e555d9', '#fa077e', '#f73849', '#ff8518'] },
      { name: 'HBO', url: 'hbomax://', color: ['#b18cff', '#5b2be0', '#120a3a'] },
      { name: 'DAZN', url: 'dazn://', color: ['#f4f4f0', '#3a3a38', '#0b0b0b'] },
    ] as App[],
  },
};
