import { createPlaceholderPage } from "@/lib/placeholder-page";
const { Page, generateMetadata, generateStaticParams } = createPlaceholderPage("galerie");
export { generateMetadata, generateStaticParams };
export default Page;
