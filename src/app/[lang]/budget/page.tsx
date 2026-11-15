import { makePage } from "@/lib/make-page";
import { BudgetView } from "@/components/budget/BudgetView";

const page = makePage("/budget", (t) => ({ title: t.budget.title, intro: t.budget.intro }), BudgetView);
export const generateMetadata = page.generateMetadata;
export default page.Page;
