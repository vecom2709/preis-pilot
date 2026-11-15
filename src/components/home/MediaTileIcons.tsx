// Farbige Symbole der Multimedia-Kacheln (eigene Zeichnungen nach der Vorlage)
const S = { width: 46, height: 46, viewBox: "0 0 48 48", "aria-hidden": true } as const;

export function TileSoftware() {
  return (<svg {...S}><rect x="5" y="9" width="38" height="24" rx="3" fill="#e0f7f5" stroke="#0f9d93" strokeWidth="2.5" /><path d="M2 38h44" stroke="#0b6f6c" strokeWidth="3" strokeLinecap="round" /><path d="m19 17-4 4 4 4M29 17l4 4-4 4M25.5 15.5l-3 11" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
export function TileVideo() {
  return (<svg {...S}><rect x="5" y="16" width="38" height="25" rx="3" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" /><path d="m6 16 36-9 1 6-36 9z" fill="#1e3a8a" /><path d="m12 14.5 4 5M20 12.5l4 5M28 10.5l4 5" stroke="#fff" strokeWidth="2" /><path d="m20 23 9 5.5-9 5.5z" fill="#0f9d93" /></svg>);
}
export function TileDesign() {
  return (<svg {...S}><path d="M24 5C13 5 5 13 5 23c0 9 7 16 15 16 3 0 4-2 3-4-1-3 1-5 4-5h5c6 0 11-4 11-10C43 12 35 5 24 5z" fill="#fde68a" stroke="#d97706" strokeWidth="2.2" /><circle cx="15" cy="20" r="3.3" fill="#ef4444" /><circle cx="22" cy="13" r="3.3" fill="#2563eb" /><circle cx="31" cy="14" r="3.3" fill="#16a34a" /><circle cx="35" cy="22" r="3.3" fill="#9333ea" /></svg>);
}
export function TileTemplates() {
  return (<svg {...S}><path d="m24 6 18 9-18 9-18-9z" fill="#fecaca" stroke="#dc2626" strokeWidth="2.2" strokeLinejoin="round" /><path d="m6 23 18 9 18-9" fill="none" stroke="#f59e0b" strokeWidth="2.6" strokeLinejoin="round" /><path d="m6 31 18 9 18-9" fill="none" stroke="#0f9d93" strokeWidth="2.6" strokeLinejoin="round" /></svg>);
}
export function TileGames() {
  return (<svg {...S}><path d="M15 15h18a10 10 0 0 1 9.6 12.8l-1.7 5.6a4.6 4.6 0 0 1-7.8 1.8L30 32H18l-3.1 3.2a4.6 4.6 0 0 1-7.8-1.8l-1.7-5.6A10 10 0 0 1 15 15z" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" /><path d="M15 21v7M11.5 24.5h7" stroke="#1e3a8a" strokeWidth="2.6" strokeLinecap="round" /><circle cx="31" cy="22.5" r="2" fill="#0f9d93" /><circle cx="35" cy="26.5" r="2" fill="#9333ea" /></svg>);
}
export function Tile3D() {
  return (<svg {...S}><path d="m24 5 17 9.5v19L24 43 7 33.5v-19z" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" /><path d="M7 14.5 24 24l17-9.5M24 24v19" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" /></svg>);
}

export const mediaTiles = [
  { slug: "software", Icon: TileSoftware },
  { slug: "video-audio", Icon: TileVideo },
  { slug: "design-kreativ", Icon: TileDesign },
  { slug: "vorlagen-pakete", Icon: TileTemplates },
  { slug: "gaming", Icon: TileGames },
  { slug: "3d-modelle", Icon: Tile3D },
];
