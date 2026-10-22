import type { DotColor } from '../lib/dots';

/**
 * Media on Thuis: the Sonos and Chromecast pages of the mini player.
 *
 * - entity: the media_player entity of each device.
 * - sonos.stations: the stream buttons. A tap runs the station's HA `script`
 *   (all the logic stays in HA). While the Sonos plays `stream` (its
 *   media_content_id), the card shows `name` as the title. `label` is a
 *   shorter text for the button; without it the button shows `name`.
 *   Stations whose script doesn't exist are hidden.
 * - chromecast.apps: buttons while nothing is casting (up to 3). A tap opens
 *   the app on the iPhone through its URL scheme.
 * - color: the colour circle on the button. One hex colour, or a list for a
 *   gradient (top left to bottom right). Without one: a colour by position.
 */
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

export const MEDIA = {
  sonos: {
    entity: 'media_player.living_room',
    stations: [
      {
        name: 'Radio 1',
        script: 'script.speel_radio1_op_chromecast',
        stream: 'http://icecast.vrtcdn.be/radio1-high.mp3',
        color: ['#ff4942', '#0068d8', '#002a66'],
      },
      {
        name: 'Studio Brussel',
        label: 'StuBru',
        script: 'script.speel_studiobrussel_op_chromecast',
        stream: 'http://icecast.vrtcdn.be/stubru-high.mp3',
        color: ['#ff4942', '#7e31aa', '#331a5c'],
      },
      {
        name: 'Tijdloze',
        script: 'script.speel_tijdloze_op_sonos',
        stream: 'http://icecast.vrtcdn.be/stubru_tijdloze-high.mp3',
        color: ['#ff4942', '#c0b06c', '#434540'],
      },
    ] as Station[],
  },
  chromecast: {
    entity: 'media_player.living_living',
    apps: [
      { name: 'Netflix', url: 'nflx://', color: ['#f0323b', '#e50914', '#141414'] },
      { name: 'VRT MAX', url: 'vrtmax://', color: ['#ff4f55', '#f5333a', '#f5333a', '#1b1d52'] },
      { name: 'VTM GO', url: 'vtmgo://', color: ['#e555d9', '#fa077e', '#f73849', '#ff8518'] },
    ] as App[],
  },
};
