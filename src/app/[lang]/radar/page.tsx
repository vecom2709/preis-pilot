import { makePage } from "@/lib/make-page";
import { RadarView } from "@/components/radar/RadarView";

const page = makePage("/radar", (t) => ({ title: t.radar.title, intro: t.radar.intro }), RadarView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
