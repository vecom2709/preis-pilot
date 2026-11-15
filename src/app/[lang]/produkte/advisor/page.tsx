import { makeMediaPage } from "@/lib/make-media-page";
import { AdvisorView } from "@/components/media/AdvisorView";

const page = makeMediaPage("/produkte/advisor", (t) => ({ title: t.advisor.title, intro: t.advisor.intro }), AdvisorView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
