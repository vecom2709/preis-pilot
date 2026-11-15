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
export const IconScreen = (p: P) => (<svg {...base(p)}><rect x="3" y="4.5" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16.5V20" /></svg>);
export const IconCart = (p: P) => (<svg {...base(p)}><path d="M3.5 4.5h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.6" /><circle cx="9.5" cy="19.5" r="1.2" /><circle cx="17" cy="19.5" r="1.2" /></svg>);
export const IconCompare = (p: P) => (<svg {...base(p)}><rect x="3.5" y="4.5" width="7" height="15" rx="1.5" /><rect x="13.5" y="4.5" width="7" height="15" rx="1.5" /><path d="M6 9h2M16 9h2M6 13h2M16 13h2" /></svg>);
export const IconCompass = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>);
export const IconPlay = (p: P) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10.5 9.5 4 2.5-4 2.5z" /></svg>);
export const IconGamepad = (p: P) => (<svg {...base(p)}><path d="M7.5 8h9a4.5 4.5 0 0 1 4.3 5.8l-.9 3a2.2 2.2 0 0 1-3.8.8L14.5 16h-5l-1.6 1.6a2.2 2.2 0 0 1-3.8-.8l-.9-3A4.5 4.5 0 0 1 7.5 8z" /><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01" /></svg>);
export const IconPhone = (p: P) => (<svg {...base(p)}><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 17.5h2" /></svg>);
export const IconLaptop = (p: P) => (<svg {...base(p)}><rect x="5" y="5" width="14" height="10" rx="1.2" /><path d="M3 18.5h18" /></svg>);
export const IconCamera = (p: P) => (<svg {...base(p)}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.3l1.5-2h5.4l1.5 2h2.3A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.3" /></svg>);
export const IconDisc = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" /><path d="M12 6.5a5.5 5.5 0 0 1 5.5 5.5" /></svg>);
export const IconSofa = (p: P) => (<svg {...base(p)}><path d="M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11" /><path d="M3.5 12.5a1.8 1.8 0 0 1 3.5-.6V14h10v-2.1a1.8 1.8 0 0 1 3.5.6V17a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" /><path d="M6 18v1.5M18 18v1.5" /></svg>);
export const IconDrop = (p: P) => (<svg {...base(p)}><path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" /></svg>);
export const IconStroller = (p: P) => (<svg {...base(p)}><path d="M12.5 4v7.5H20a7.5 7.5 0 0 0-7.5-7.5z" /><path d="M3 6h2.2l1.6 5.5H20a6 6 0 0 1-6 6h-3.5A3.8 3.8 0 0 1 6.8 11.5" /><circle cx="8.5" cy="19.5" r="1.5" /><circle cx="16.5" cy="19.5" r="1.5" /></svg>);
export const IconDumbbell = (p: P) => (<svg {...base(p)}><path d="M7 7v10M17 7v10M4 9.5v5M20 9.5v5M7 12h10" /></svg>);
export const IconSprout = (p: P) => (<svg {...base(p)}><path d="M12 20v-8" /><path d="M12 12c0-3.5-2.5-6-7-6 0 4 2.5 6.5 7 6z" /><path d="M12 14.5c0-3 2.2-5.5 7-5.5 0 3.6-2.6 5.5-7 5.5z" /><path d="M7 20h10" /></svg>);
export const IconCar = (p: P) => (<svg {...base(p)}><path d="M4 16.5v-3.2a2 2 0 0 1 .5-1.3L7 8.6a2 2 0 0 1 1.6-.8h6.8a2 2 0 0 1 1.6.8l2.5 3.4a2 2 0 0 1 .5 1.3v3.2a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1z" /><circle cx="7.5" cy="14.3" r="1" /><circle cx="16.5" cy="14.3" r="1" /><path d="M6 17.5v1.5M18 17.5v1.5" /></svg>);
export const IconMinus = (p: P) => (<svg {...base(p)}><path d="M6 12h12" /></svg>);
export const IconPalette = (p: P) => (<svg {...base(p)}><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.9 1.4-1.9-.5-1.3.3-2.6 1.7-2.6h2.1a3.3 3.3 0 0 0 3.3-3.3C20.5 7.5 16.7 3.5 12 3.5z" /><circle cx="7.8" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="7.8" r="1" /></svg>);
export const IconLayers = (p: P) => (<svg {...base(p)}><path d="m12 4 8.5 4.5L12 13 3.5 8.5z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" /></svg>);
export const IconCube = (p: P) => (<svg {...base(p)}><path d="m12 3.5 8 4.5v8L12 20.5 4 16V8z" /><path d="m4 8 8 4.5L20 8M12 12.5v8" /></svg>);
export const IconMusic = (p: P) => (<svg {...base(p)}><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>);
export const IconWrench = (p: P) => (<svg {...base(p)}><path d="M14.5 6.5a4 4 0 0 0 4.9 5L20 12l-8.5 8.5a2.1 2.1 0 0 1-3-3L17 9l.5.6a4 4 0 0 1-3-3.1z" /><path d="M14.7 3.7a4 4 0 0 1 5.6 5.6" /></svg>);
export const IconTire = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" /></svg>);
export const IconToy = (p: P) => (<svg {...base(p)}><circle cx="8" cy="7" r="2.3" /><circle cx="16" cy="7" r="2.3" /><circle cx="12" cy="13" r="6" /><path d="M10 12h.01M14 12h.01M10.5 15.2c.9.7 2.1.7 3 0" /></svg>);
export const IconTent = (p: P) => (<svg {...base(p)}><path d="m12 4-9 16h18z" /><path d="m12 4 0 0M12 11l-3.5 9M12 11l3.5 9" /></svg>);
export const IconBike = (p: P) => (<svg {...base(p)}><circle cx="6" cy="16" r="3.5" /><circle cx="18" cy="16" r="3.5" /><path d="M6 16l4-7h5l3 7M10 9l2 7h2M14 6h2.5" /></svg>);
export const IconMotorbike = (p: P) => (<svg {...base(p)}><circle cx="5.5" cy="16" r="3" /><circle cx="18.5" cy="16" r="3" /><path d="M5.5 16h5l3-5h3l2 5M13.5 11l-1.5-3H9M16 8h2.5" /></svg>);
