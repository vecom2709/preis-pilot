// Symbole je Produkt-Kategorie (ohne Client-Code, damit auch Server-Seiten sie nutzen können)
import {
  IconBike, IconCamera, IconCar, IconCube, IconDisc, IconDrop, IconDumbbell, IconGamepad, IconLaptop, IconLayers, IconMotorbike,
  IconMusic, IconPalette, IconPhone, IconScreen, IconSofa, IconSprout, IconStroller, IconTent, IconTire, IconToy, IconWrench,
} from "@/components/ui/icons";

export const categoryIcons: Record<string, typeof IconScreen> = {
  "tv-heimkino": IconScreen,
  "smartphones-tablets": IconPhone,
  "computer-hardware": IconLaptop,
  gaming: IconGamepad,
  "foto-video-audio": IconCamera,
  software: IconDisc,
  "video-audio": IconMusic,
  "design-kreativ": IconPalette,
  "vorlagen-pakete": IconLayers,
  "3d-modelle": IconCube,
  haushaltsgeraete: IconSofa,
  wohnen: IconSofa,
  "pflege-gesundheit": IconDrop,
  "baby-ausstattung": IconStroller,
  spielzeug: IconToy,
  fitness: IconDumbbell,
  "outdoor-camping": IconTent,
  fahrrad: IconBike,
  werkzeug: IconWrench,
  gartengeraete: IconSprout,
  "garten-pflanzen": IconSprout,
  reifen: IconTire,
  "auto-zubehoer": IconCar,
  motorrad: IconMotorbike,
};
