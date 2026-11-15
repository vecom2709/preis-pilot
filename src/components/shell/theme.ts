import { STORAGE_KEY } from "@/lib/store/schema";

export function applyTheme(theme: "system" | "light" | "dark") {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Läuft vor dem ersten Zeichnen, damit beim Laden nichts aufblitzt. */
export const themeBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");var t=(s.settings&&s.settings.theme)||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;
