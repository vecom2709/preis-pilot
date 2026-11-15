import { makePage } from "@/lib/make-page";
import { ComparisonsView } from "@/components/catalog/ComparisonsView";

const page = makePage("/comparisons", (t) => ({ title: t.comparisonsPage.title, intro: t.comparisonsPage.intro }), ComparisonsView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
