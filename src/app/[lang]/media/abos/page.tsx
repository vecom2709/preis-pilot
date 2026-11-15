import { makeMediaPage } from "@/lib/make-media-page";
import { AbosView } from "@/components/media/AbosView";

const page = makeMediaPage("/media/abos", (t) => ({ title: t.abos.title, intro: t.abos.intro }), AbosView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
