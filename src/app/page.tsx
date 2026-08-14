import { PublicPortfolioExperience } from "@/components/public/public-portfolio-experience";
import { properties as seedProperties } from "@/lib/property-data";
import { getPublishedProperties } from "@/lib/published-properties";

export const revalidate = 60;

export default async function HomePage() {
  const published = await getPublishedProperties();
  const merged = new Map(
    seedProperties
      .filter((property) => property.status === "Live")
      .map((property) => [property.slug, property]),
  );
  published.forEach(({ property }) => {
    if (property.status === "Live") merged.set(property.slug, property);
  });

  return (
    <PublicPortfolioExperience properties={Array.from(merged.values())} />
  );
}
