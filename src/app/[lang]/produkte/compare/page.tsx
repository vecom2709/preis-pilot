import { makeMediaPage } from "@/lib/make-media-page";
import { CompareView } from "@/components/media/CompareView";

const page = makeMediaPage("/produkte/compare", (t) => ({ title: t.compare.title, intro: t.compare.intro }), CompareView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
