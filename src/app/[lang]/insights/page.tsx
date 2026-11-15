import { makePage } from "@/lib/make-page";
import { InsightsView } from "@/components/insights/InsightsView";

const page = makePage("/insights", (t) => ({ title: t.insights.title, intro: t.insights.intro }), InsightsView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
