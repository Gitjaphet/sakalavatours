import { createPlaceholderPage } from "@/lib/placeholder-page";
const { Page, generateMetadata, generateStaticParams } = createPlaceholderPage("excursion");
export { generateMetadata, generateStaticParams };
export default Page;
