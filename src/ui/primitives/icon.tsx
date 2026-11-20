const P = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  wallet: 'M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2',
  card: 'M2 6h20v12H2zM2 10h20',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  target:
    'M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  calc: 'M5 3h14v18H5zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3',
  ticket: 'M3 7h18v4a2 2 0 000 2v4H3v-4a2 2 0 000-2z',
  flow: 'M3 12h4l3-8 4 16 3-8h4',
  pie: 'M21 12A9 9 0 1112 3v9zM15 3.5A9 9 0 0120.5 9H15z',
  back: 'M15 18l-6-6 6-6',
  check: 'M5 12l5 5 9-10',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeoff:
    'M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c6 0 10 6 10 6a16 16 0 01-3.2 3.7M6.6 7.6C4 9.3 2 12 2 12s4 7 10 7a9.7 9.7 0 004.2-1M9.9 9.9a3 3 0 004.2 4.2',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  cal: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  chevron: 'M9 6l6 6-6 6',
  x: 'M6 6l12 12M18 6L6 18',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  cart: 'M3 4h3l2 12h10l2-8H7M10 20h.01M17 20h.01',
  backspace: 'M21 5H9l-6 7 6 7h12zM13 9l4 6M17 9l-4 6',
  fork: 'M5 3v6a2 2 0 004 0V3M7 11v10M17 3c-2 2-3 5-3 8h3zM17 11v10',
  car: 'M5 16l1.5-6h11L19 16M3 16h18v3H3zM7 19v2M17 19v2',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5M9 7h6',
  bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 016 0v2',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8h.01',
  plane: 'M3 13l18-8-6 16-3-7zM12 14l9-9',
  offline: 'M2 8.8a15 15 0 0120 0M5 12.5a10 10 0 0114 0M9 16a5 5 0 016 0M12 20h.01M3 3l18 18',
} as const;
export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 22,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={P[name]} />
    </svg>
  );
}
