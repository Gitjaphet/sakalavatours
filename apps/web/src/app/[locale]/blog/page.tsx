import { createPlaceholderPage } from "@/lib/placeholder-page";
const { Page, generateMetadata, generateStaticParams } = createPlaceholderPage("blog");
export { generateMetadata, generateStaticParams };
export default Page;
