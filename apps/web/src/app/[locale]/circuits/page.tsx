import { createPlaceholderPage } from "@/lib/placeholder-page";
const { Page, generateMetadata, generateStaticParams } = createPlaceholderPage("circuits");
export { generateMetadata, generateStaticParams };
export default Page;
