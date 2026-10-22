import type { DotColor } from '../lib/dots';

export const SONOS = 'media_player.living_room';

export const CHROMECAST = 'media_player.living_living';

const RADIO_1: DotColor = ['#ff4942', '#0068d8', '#002a66'];
const STUBRU: DotColor = ['#ff4942', '#7e31aa', '#331a5c'];
export const TIJDLOZE: DotColor = ['#ff4942', '#c0b06c', '#434540'];

export interface StreamScript {
  script: string;
  color?: DotColor;
}

export const STREAM_SCRIPTS: StreamScript[] = [
  { script: 'script.speel_radio1_op_chromecast', color: RADIO_1 },
  { script: 'script.speel_studiobrussel_op_chromecast', color: STUBRU },
  { script: 'script.speel_tijdloze_op_sonos', color: TIJDLOZE },
];

export const STREAM_NAMES: Record<string, string> = {
  'http://icecast.vrtcdn.be/radio1-high.mp3': 'Radio 1',
  'http://icecast.vrtcdn.be/stubru-high.mp3': 'Studio Brussel',
  'http://icecast.vrtcdn.be/stubru_tijdloze-high.mp3': 'Studio Brussel'
};

export interface CastApp {
  name: string;
  url: string;
  color?: DotColor;
}

export const CAST_APPS: CastApp[] = [
  { name: 'Netflix', url: 'nflx://', color: ['#f0323b', '#e50914', '#141414'] },
  { name: 'VRT MAX', url: 'vrtmax://', color: ['#ff4f55', '#f5333a', '#f5333a', '#1b1d52'] },
  { name: 'VTM GO', url: 'vtmgo://', color: ['#e555d9', '#fa077e', '#f73849', '#ff8518'] },
];
