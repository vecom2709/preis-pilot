import type { Locale } from "../config";
import de, { type MediaDictionary } from "./de";
import it from "./it";
import en from "./en";

const dicts: Record<Locale, MediaDictionary> = { de, it, en };
export function getMediaDictionary(locale: Locale): MediaDictionary {
  return dicts[locale];
}
