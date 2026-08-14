import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicListingExperience } from "@/components/public/public-listing-experience";
import { buildPriceContext } from "@/lib/price-context";
import {
  decodePropertyPreview,
  getProjectCategory,
  getPropertyBySlug,
  properties,
  type Property,
} from "@/lib/property-data";
import {
  getPublishedProperties,
  getPublishedProperty,
} from "@/lib/published-properties";

export const dynamic = "force-dynamic";

interface ListingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}

export function generateStaticParams() {
  return properties
    .filter((property) => property.status === "Live")
    .map((property) => ({ slug: property.slug }));
}

/**
 * Drafts are unfinished inventory. They stay reachable through the agent's
 * signed preview link so the editor can still check their work, but a plain
 * public URL must not serve them.
 */
function publiclyVisible(property: Property | undefined) {
  return property && property.status === "Live" ? property : undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const decodedPreview = decodePropertyPreview(preview);
  const publishedProperty = decodedPreview
    ? undefined
    : await getPublishedProperty(slug);
  const property =
    decodedPreview ??
    publiclyVisible(publishedProperty?.property) ??
    publiclyVisible(getPropertyBySlug(slug));
  if (!property) return {};
  const description = `${property.title} in ${property.location}, Dubai · ${property.bedrooms} bedrooms · ${property.area} · Enquire privately for the best available offer`;
  return {
    title: property.title,
    description,
    openGraph: {
      type: "website",
      title: property.title,
      description,
      images: [
        {
          url: property.images[0],
          alt: `${property.title} in ${property.location}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      images: [property.images[0]],
    },
  };
}

export default async function ListingPage({
  params,
  searchParams,
}: ListingPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const decodedPreview = decodePropertyPreview(preview);
  const publishedProperty = decodedPreview
    ? undefined
    : await getPublishedProperty(slug);
  const property =
    decodedPreview ??
    publiclyVisible(publishedProperty?.property) ??
    publiclyVisible(getPropertyBySlug(slug));
  if (!property) notFound();

  const publishedProperties = await getPublishedProperties();
  const inventory = new Map(
    properties
      .filter((item) => item.status === "Live")
      .map((item) => [item.slug, item]),
  );
  publishedProperties.forEach(({ property: item }) => {
    if (item.status === "Live") inventory.set(item.slug, item);
  });
  const candidates = Array.from(inventory.values()).filter(
    (item) => item.slug !== property.slug,
  );
  const normalizedDeveloper = property.developer?.trim().toLowerCase();
  const developerProperties = normalizedDeveloper
    ? candidates
        .filter(
          (item) =>
            item.developer?.trim().toLowerCase() === normalizedDeveloper,
        )
        .slice(0, 8)
    : [];
  const developerIds = new Set(developerProperties.map((item) => item.id));
  const similarProperties = candidates
    .filter((item) => !developerIds.has(item.id))
    .sort(
      (left, right) =>
        similarityScore(right, property) - similarityScore(left, property),
    )
    .slice(0, 8);

  return (
    <PublicListingExperience
      property={property}
      developerProperties={developerProperties}
      similarProperties={similarProperties}
      priceContext={buildPriceContext(property, candidates)}
    />
  );
}

function similarityScore(candidate: Property, source: Property) {
  let score = 0;
  if (
    (candidate.community ?? candidate.location) ===
    (source.community ?? source.location)
  ) {
    score += 8;
  }
  if (getProjectCategory(candidate) === getProjectCategory(source)) score += 5;
  if (candidate.type === source.type) score += 4;
  if (candidate.bedrooms === source.bedrooms) score += 3;
  if (candidate.developer && candidate.developer === source.developer) score += 2;
  if (candidate.possessionYear === source.possessionYear) score += 1;
  return score;
}
