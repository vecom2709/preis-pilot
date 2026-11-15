import { makeMediaPage } from "@/lib/make-media-page";
import { MediaHub } from "@/components/media/MediaHub";

const page = makeMediaPage("/produkte", (t) => ({ title: t.hub.title, intro: t.hub.intro }), MediaHub);
export const generateMetadata = page.generateMetadata;
export default page.Page;
