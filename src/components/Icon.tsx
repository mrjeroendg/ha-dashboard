const PATHS = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  coffee: <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3" />,
  blinds: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 8h16M4 12h16M4 16h16" />
    </>
  ),
  leave: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />,
  thermometer: <path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z" />,
  car: (
    <>
      <path d="M5 17h14v-5l-2-5H7l-2 5z" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
  sofa: <path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z" />,
  tv: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  power: <path d="M12 3v9M6.3 7.5a8 8 0 1 0 11.4 0" />,
  window: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M12 3v18M4 12h16" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  sprout: <path d="M12 21v-8M12 13c0-4 3-7 7-7 0 4-3 7-7 7zM12 15c0-3-2-5-5-5 0 3 2 5 5 5z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  alert: <path d="M12 8v5M12 16.5v.5M10.3 3.9L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
  home: <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />,
  plug: <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5" />,
  door: (
    <>
      <path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18" />
      <circle cx="14.5" cy="12" r="1" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  droplet: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  gauge: <path d="M4 15a8 8 0 1 1 16 0M12 15l4-4" />,
  play: <path d="M8 5v14l11-7z" />,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  pause: <path d="M9 6v12M15 6v12" />,
  next: <path d="M6 6l9 6-9 6zM18 6v12" />,
  radio: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2.5" />
      <circle cx="15.5" cy="14" r="2.5" />
      <path d="M7 12h3M7 15.5h3M6 8l11-4.5" />
    </>
  ),
  previous: <path d="M18 6l-9 6 9 6zM6 6v12" />,
  volume: <path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />,
  rewind: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />,
  forward: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />,
  update: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5M12 8v5l3 2" />
    </>
  ),
  garage: <path d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 16h10" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  left: <path d="M19 12H5M11 6l-6 6 6 6" />,
  right: <path d="M5 12h14M13 6l6 6-6 6" />,
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none" />,
  phone: <path d="M8.5 2.5h7a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM11 18.5h2" />,
  tablet: <path d="M7 2.5h10a2.5 2.5 0 0 1 2.5 2.5v14a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19V5A2.5 2.5 0 0 1 7 2.5zM11 18.5h2" />,
  baby: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 5c0-1.7 1.8-2.5 2.8-1.3M9 12.5h.01M15 12.5h.01M9.8 16.3c1.3.9 3.1.9 4.4 0" />
    </>
  ),
  cat: (
    <>
      <path d="M5 9L4 4l4 3h8l4-3-1 5v4a7 7 0 0 1-14 0z" />
      <path d="M9.5 12.5h.01M14.5 12.5h.01M11 15.5l1 .8 1-.8" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  garageCar: (
    <>
      <path d="M2 10l10-6 10 6" />
      <path d="M4 9v12M20 9v12" />
      <path d="M7.5 19h9v-3l-1.5-3h-6L7.5 16z" />
      <path d="M9 19v1.5M15 19v1.5" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18V6M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-7v5" />
      <circle cx="7" cy="10" r="1.6" />
    </>
  ),
  shower: (
    <>
      <path d="M4 21V7a4 4 0 0 1 8 0" />
      <path d="M9 7h6" />
      <path d="M10 11v.5M13 11v.5M16 11v.5M11.5 14v.5M14.5 14v.5M13 17v.5" />
    </>
  ),
  smoke: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" />
    </>
  ),
  // Airco (docs/design/airco-sheet).
  auto: <path d="M7.5 18l4.5-12 4.5 12M9.2 13.5h5.6" />,
  snowflake: (
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5M3.9 10.6l3.4.9-.9 3.4M20.1 13.4l-3.4-.9.9-3.4" />
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 10.4C11 7 12 3.5 15 3.5c2.6 0 2.6 4.2-1.6 7" />
      <path transform="rotate(120 12 12)" d="M12 10.4C11 7 12 3.5 15 3.5c2.6 0 2.6 4.2-1.6 7" />
      <path transform="rotate(240 12 12)" d="M12 10.4C11 7 12 3.5 15 3.5c2.6 0 2.6 4.2-1.6 7" />
    </>
  ),
  // Fan speed 1–5: that many bars filled.
  fanSpeed1: (
    <>
      <rect x="3" y="16" width="2.6" height="4" rx="1.1" className="icon__filled" />
      <rect x="7" y="12.5" width="2.6" height="7.5" rx="1.1" className="icon__faint" />
      <rect x="11" y="9" width="2.6" height="11" rx="1.1" className="icon__faint" />
      <rect x="15" y="5.5" width="2.6" height="14.5" rx="1.1" className="icon__faint" />
      <rect x="19" y="2" width="2.6" height="18" rx="1.1" className="icon__faint" />
    </>
  ),
  fanSpeed2: (
    <>
      <rect x="3" y="16" width="2.6" height="4" rx="1.1" className="icon__filled" />
      <rect x="7" y="12.5" width="2.6" height="7.5" rx="1.1" className="icon__filled" />
      <rect x="11" y="9" width="2.6" height="11" rx="1.1" className="icon__faint" />
      <rect x="15" y="5.5" width="2.6" height="14.5" rx="1.1" className="icon__faint" />
      <rect x="19" y="2" width="2.6" height="18" rx="1.1" className="icon__faint" />
    </>
  ),
  fanSpeed3: (
    <>
      <rect x="3" y="16" width="2.6" height="4" rx="1.1" className="icon__filled" />
      <rect x="7" y="12.5" width="2.6" height="7.5" rx="1.1" className="icon__filled" />
      <rect x="11" y="9" width="2.6" height="11" rx="1.1" className="icon__filled" />
      <rect x="15" y="5.5" width="2.6" height="14.5" rx="1.1" className="icon__faint" />
      <rect x="19" y="2" width="2.6" height="18" rx="1.1" className="icon__faint" />
    </>
  ),
  fanSpeed4: (
    <>
      <rect x="3" y="16" width="2.6" height="4" rx="1.1" className="icon__filled" />
      <rect x="7" y="12.5" width="2.6" height="7.5" rx="1.1" className="icon__filled" />
      <rect x="11" y="9" width="2.6" height="11" rx="1.1" className="icon__filled" />
      <rect x="15" y="5.5" width="2.6" height="14.5" rx="1.1" className="icon__filled" />
      <rect x="19" y="2" width="2.6" height="18" rx="1.1" className="icon__faint" />
    </>
  ),
  fanSpeed5: (
    <>
      <rect x="3" y="16" width="2.6" height="4" rx="1.1" className="icon__filled" />
      <rect x="7" y="12.5" width="2.6" height="7.5" rx="1.1" className="icon__filled" />
      <rect x="11" y="9" width="2.6" height="11" rx="1.1" className="icon__filled" />
      <rect x="15" y="5.5" width="2.6" height="14.5" rx="1.1" className="icon__filled" />
      <rect x="19" y="2" width="2.6" height="18" rx="1.1" className="icon__filled" />
    </>
  ),
  // Vanes up and down, seen from the side: the unit top left, the air from straight out (1) to straight down (5).
  vaneUpDown1: (
    <>
      <path d="M3 4.5h9" className="icon__unit" />
      <path d="M5 7.5L17.9 9.3M14.2 10.8L17.9 9.3L14.7 6.8" />
    </>
  ),
  vaneUpDown2: (
    <>
      <path d="M3 4.5h9" className="icon__unit" />
      <path d="M5 7.5L16.5 13.6M12.5 13.7L16.5 13.6L14.4 10.2" />
    </>
  ),
  vaneUpDown3: (
    <>
      <path d="M3 4.5h9" className="icon__unit" />
      <path d="M5 7.5L13.7 17.2M9.9 16L13.7 17.2L12.9 13.3" />
    </>
  ),
  vaneUpDown4: (
    <>
      <path d="M3 4.5h9" className="icon__unit" />
      <path d="M5 7.5L9.9 19.6M6.7 17.1L9.9 19.6L10.5 15.6" />
    </>
  ),
  vaneUpDown5: (
    <>
      <path d="M3 4.5h9" className="icon__unit" />
      <path d="M5 7.5L5.9 20.5M3.7 17.2L5.9 20.5L7.7 16.9" />
    </>
  ),
  vaneUpDownSwing: (
    <>
      <path d="M3 4.5h9" className="icon__unit" />
      <path d="M16.8 9.6A12 12 0 0 1 6.7 19.4M18.3 12.9L16.8 9.6L14.3 12.1M9.3 16.9L6.7 19.4L9.9 21" />
    </>
  ),
  // Vanes left and right, seen from above: the unit at the top, the air from far left (1) to far right (5).
  vaneLeftRight1: (
    <>
      <path d="M6 4h12" className="icon__unit" />
      <path d="M12 6.5L1.4 14M3.1 10.4L1.4 14L5.4 13.7" />
    </>
  ),
  vaneLeftRight2: (
    <>
      <path d="M6 4h12" className="icon__unit" />
      <path d="M12 6.5L5.9 18M5.8 14L5.9 18L9.3 15.9" />
    </>
  ),
  vaneLeftRight3: (
    <>
      <path d="M6 4h12" className="icon__unit" />
      <path d="M12 6.5L12 19.5M10 16L12 19.5L14 16" />
    </>
  ),
  vaneLeftRight4: (
    <>
      <path d="M6 4h12" className="icon__unit" />
      <path d="M12 6.5L18.1 18M14.7 15.9L18.1 18L18.2 14" />
    </>
  ),
  vaneLeftRight5: (
    <>
      <path d="M6 4h12" className="icon__unit" />
      <path d="M12 6.5L22.6 14M18.6 13.7L22.6 14L20.9 10.4" />
    </>
  ),
  vaneLeftRightSwing: (
    <>
      <path d="M6 4h12" className="icon__unit" />
      <path d="M21 12.8A11 11 0 0 1 3 12.8M21 16.4L21 12.8L17.6 14M6.4 14L3 12.8L3 16.4" />
    </>
  ),
  // Verbruik (docs/design/verbruik).
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  flame: <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8a7 7 0 0 0 7 7z" />,
  // Lawn mower (docs/design/lawn-mower).
  mower: (
    <>
      <path d="M3 15h14l2-5h-6l-2 5M13 10l2-4" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="16" cy="17.5" r="2" />
    </>
  ),
  battery: <path d="M5 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM21 11v2" />,
  signal: <path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M12 19h.01" />,
  blade: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10V3M12 14v7M10 12H3M14 12h7" />
    </>
  ),
  // Birthdays in the status band (docs/design/now-ticker).
  cake: (
    <>
      <path d="M4 21h16M5 21v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M5 17c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0 1.4-1 2-1M12 13v-3" />
      <path d="M12 4.5c.9.9.9 2 0 2.6-.9-.6-.9-1.7 0-2.6z" />
    </>
  ),
  // Media shortcuts in the navigation (docs/design/media-dock).
  speaker: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="3" />
      <circle cx="12" cy="14" r="3" />
      <path d="M12 7h.01" />
    </>
  ),
  route: <path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
