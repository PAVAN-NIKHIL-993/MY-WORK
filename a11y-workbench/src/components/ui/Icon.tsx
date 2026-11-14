/**
 * Icon set.
 *
 * A single inline SVG component with a name union instead of an icon
 * dependency: the app uses ~24 glyphs, all decorative (they always sit next to a
 * text label or on a button that has an accessible name), so they are rendered
 * with `aria-hidden="true"` and `focusable="false"`.
 *
 * Stroke geometry is drawn on a 24px grid with 1.7 stroke width so icons stay
 * optically consistent at 16-20px.
 */

import type { SVGProps } from 'react';

export type IconName =
  | 'gauge'
  | 'folder'
  | 'list-checks'
  | 'file-text'
  | 'palette'
  | 'book'
  | 'settings'
  | 'plus'
  | 'search'
  | 'x'
  | 'check'
  | 'check-circle'
  | 'alert-triangle'
  | 'alert-circle'
  | 'info'
  | 'chevron-right'
  | 'chevron-down'
  | 'arrow-right'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'download'
  | 'upload'
  | 'trash'
  | 'copy'
  | 'external'
  | 'clock'
  | 'printer'
  | 'shield'
  | 'sparkle';

const PATHS: Record<IconName, JSX.Element> = {
  gauge: (
    <>
      <path d="M4 19a9 9 0 1 1 16 0" />
      <path d="M12 13.5 15.5 9" />
    </>
  ),
  folder: <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2.5h8.5A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z" />,
  'list-checks': (
    <>
      <path d="M4 6.5 5.5 8 8 5" />
      <path d="M4 12l1.5 1.5L8 11" />
      <path d="M4 17.5 5.5 19 8 16.5" />
      <path d="M11 7h9M11 12.5h9M11 18h9" />
    </>
  ),
  'file-text': (
    <>
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18a3 3 0 0 0 3-3A8.8 8.8 0 0 0 12 3Z" />
      <circle cx="8.5" cy="9" r="1" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="8" cy="13.5" r="1" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16 9.5" />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="M12 4.5 21 19H3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  'arrow-right': <path d="M4 12h15M13 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M5.4 18.6l1.4-1.4M17.2 6.8l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 0 1 10.5 4a8.2 8.2 0 1 0 9.5 9.5Z" />,
  download: (
    <>
      <path d="M12 4v10.5M7.5 10.5 12 15l4.5-4.5" />
      <path d="M5 18.5h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.5V5M7.5 9.5 12 5l4.5 4.5" />
      <path d="M5 18.5h14" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M6.5 7l.9 12.2h9.2L17.5 7" />
      <path d="M10.5 10.5v6M13.5 10.5v6" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.6" />
      <path d="M15 6.5V5.6A1.6 1.6 0 0 0 13.4 4H5.6A1.6 1.6 0 0 0 4 5.6v7.8A1.6 1.6 0 0 0 5.6 15h.9" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="m20 4-8.5 8.5" />
      <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  printer: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="1.5" />
      <path d="M7 13.5h10V20H7z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v6c0 4-3 7-7 8.5C8 19 5 16 5 12V6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9Z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Pixel size; both width and height. Default 18. */
  size?: number;
}

export function Icon({ name, size = 18, strokeWidth = 1.7, ...rest }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
