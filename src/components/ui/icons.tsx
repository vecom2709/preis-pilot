import type { SVGProps } from "react";

// Schlanke Linien-Icons (24px Raster, 1.75 Strich) – eigene Zeichnung, keine Fremdbibliothek.
type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconHome = (p: P) => (<svg {...base(p)}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>);
export const IconSearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>);
export const IconScan = (p: P) => (<svg {...base(p)}><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" /><path d="M8 8v8M11 8v8M13.5 8v8M16 8v8" /></svg>);
export const IconList = (p: P) => (<svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M4 18h2" /></svg>);
export const IconWallet = (p: P) => (<svg {...base(p)}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><path d="M4 7.5V18a2 2 0 0 0 2 2h14V8H6.5A2.5 2.5 0 0 1 4 5.5" /><circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" /></svg>);
export const IconTag = (p: P) => (<svg {...base(p)}><path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5l8 8a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0z" /><circle cx="8" cy="8" r="1.4" /></svg>);
export const IconRadar = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12 18 6" /></svg>);
export const IconChart = (p: P) => (<svg {...base(p)}><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></svg>);
export const IconUser = (p: P) => (<svg {...base(p)}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></svg>);
export const IconMenu = (p: P) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = (p: P) => (<svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>);
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconTrash = (p: P) => (<svg {...base(p)}><path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.8 12.2a1 1 0 0 0 1 .8h7.4a1 1 0 0 0 1-.8L17.5 7" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const IconFlash = (p: P) => (<svg {...base(p)}><path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z" /></svg>);
export const IconSwitch = (p: P) => (<svg {...base(p)}><path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5" /></svg>);
export const IconDownload = (p: P) => (<svg {...base(p)}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" /></svg>);
export const IconUpload = (p: P) => (<svg {...base(p)}><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14" /></svg>);
export const IconBell = (p: P) => (<svg {...base(p)}><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></svg>);
export const IconStar = (p: P) => (<svg {...base(p)}><path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" /></svg>);
export const IconExternal = (p: P) => (<svg {...base(p)}><path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>);
export const IconSettings = (p: P) => (<svg {...base(p)}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>);
export const IconScale = (p: P) => (<svg {...base(p)}><path d="M12 4v16M8 20h8M5 7h14M12 4l-1 3h2zM5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base(p)}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3.5v3M16 3.5v3M4 10h16M8 13.5h2M14 13.5h2M8 16.5h2M14 16.5h2" /></svg>);
export const IconPiggy = (p: P) => (<svg {...base(p)}><path d="M5 11.5c0-3 3-5.5 7-5.5 1.6 0 3 .3 4.2 1l2.3-1v3c.9.8 1.5 1.8 1.5 3H21v3h-1.5c-.6 1.2-1.6 2.1-2.8 2.7V20h-3v-1.4a9 9 0 0 1-3.4 0V20h-3v-2.2C5.9 16.7 5 14.9 5 13" /><path d="M5 12H3.5M15.5 10.2h.01M10 7.5h4" /></svg>);
export const IconLeaf = (p: P) => (<svg {...base(p)}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19 13 11" /></svg>);
export const IconCalculator = (p: P) => (<svg {...base(p)}><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8 7.5h8M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 17.5h.01M12 17.5h.01M15.5 17.5h.01" strokeWidth="2.2" /></svg>);
export const IconChevron = (p: P) => (<svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>);
export const IconBasket = (p: P) => (<svg {...base(p)}><path d="M4 9h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5zM8.5 9 11 4M15.5 9 13 4M9 13v3M12 13v3M15 13v3" /></svg>);
export const IconChecklist = (p: P) => (<svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="m7.5 10 1.5 1.5L12 8.5M7.5 15.5l1.5 1.5 3-3M14 10h3M14 15.5h3" /></svg>);
