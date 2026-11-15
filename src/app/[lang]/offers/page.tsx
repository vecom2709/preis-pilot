import { makePage } from "@/lib/make-page";
import { OffersView } from "@/components/offers/OffersView";

const page = makePage("/offers", (t) => ({ title: t.offers.title, intro: t.offers.intro }), OffersView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
