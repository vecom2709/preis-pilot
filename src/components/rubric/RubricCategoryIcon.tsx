import { categoryIcons } from "@/components/media/shared-icons";
import { IconBasket, IconScreen } from "@/components/ui/icons";

export function RubricCategoryIcon({ slug, kind }: { slug: string; kind: "food" | "products" }) {
  const Icon = kind === "food" ? IconBasket : (categoryIcons[slug] ?? IconScreen);
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-pine-tint text-pine">
      <Icon width={22} height={22} />
    </span>
  );
}
