"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { MediaDictionary } from "./de";

const Ctx = createContext<MediaDictionary | null>(null);

/** Multimedia-Texte werden nur auf Multimedia-Seiten geladen (kleinere Pakete für die Lebensmittelwelt). */
export function MediaI18nProvider({ dict, children }: { dict: MediaDictionary; children: ReactNode }) {
  return <Ctx.Provider value={dict}>{children}</Ctx.Provider>;
}

export function useMediaT(): MediaDictionary {
  const v = useContext(Ctx);
  if (!v) throw new Error("MediaI18nProvider fehlt");
  return v;
}
