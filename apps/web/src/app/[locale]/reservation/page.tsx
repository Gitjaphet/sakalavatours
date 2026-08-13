import { createPlaceholderPage } from "@/lib/placeholder-page";
const { Page, generateMetadata, generateStaticParams } = createPlaceholderPage("reservation");
export { generateMetadata, generateStaticParams };
export default Page;
