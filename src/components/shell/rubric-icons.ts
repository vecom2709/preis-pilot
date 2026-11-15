import { IconBasket, IconCar, IconDrop, IconDumbbell, IconLaptop, IconPlay, IconSofa, IconSprout, IconStroller } from "@/components/ui/icons";

export const rubricIcons: Record<string, typeof IconBasket> = {
  lebensmittel: IconBasket,
  "elektronik-technik": IconLaptop,
  "haushalt-wohnen": IconSofa,
  "drogerie-gesundheit": IconDrop,
  "baby-kind": IconStroller,
  "sport-freizeit": IconDumbbell,
  "garten-heimwerken": IconSprout,
  "auto-motorrad": IconCar,
  "multimedia-entertainment": IconPlay,
};
