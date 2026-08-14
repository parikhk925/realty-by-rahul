import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicCollectionExperience } from "@/components/public/public-collection-experience";
import {
  decodeCollectionPreview,
  getCollectionBySlug,
  properties,
} from "@/lib/property-data";
import { getPublishedCollection } from "@/lib/published-collections";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const decodedPreview = decodeCollectionPreview(preview);
  const publishedCollection = decodedPreview
    ? undefined
    : await getPublishedCollection(slug);
  const collection =
    decodedPreview?.collection ??
    publishedCollection?.collection ??
    getCollectionBySlug(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const decodedPreview = decodeCollectionPreview(preview);
  const publishedCollection = decodedPreview
    ? undefined
    : await getPublishedCollection(slug);
  const collection =
    decodedPreview?.collection ??
    publishedCollection?.collection ??
    getCollectionBySlug(slug);
  if (!collection) notFound();
  const collectionProperties = (
    decodedPreview?.properties ??
    publishedCollection?.properties ??
    collection.propertyIds
      .map((id) => properties.find((property) => property.id === id))
      .filter((property) => property !== undefined)
  ).filter(
    // A shortlist can go stale when a member is pulled back to Draft; the
    // agent's own preview still shows everything they selected.
    (property) => Boolean(decodedPreview) || property.status === "Live",
  );
  return (
    <PublicCollectionExperience
      collection={collection}
      collectionProperties={collectionProperties}
    />
  );
}
