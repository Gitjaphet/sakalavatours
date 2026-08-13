import { createPlaceholderPage } from "@/lib/placeholder-page";
const { Page, generateMetadata, generateStaticParams } = createPlaceholderPage("avis");
export { generateMetadata, generateStaticParams };
export default Page;
