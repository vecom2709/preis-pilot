import { makePage } from "@/lib/make-page";
import { AccountView } from "@/components/account/AccountView";

const page = makePage("/account", (t) => ({ title: t.account.title, intro: t.account.intro }), AccountView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
