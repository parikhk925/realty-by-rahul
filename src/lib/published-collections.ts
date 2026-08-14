import "server-only";

import { get } from "@vercel/blob";
import {
  isProperty,
  isPropertyCollection,
  Property,
  PropertyCollection,
} from "@/lib/property-data";

export interface PublishedCollectionPayload {
  collection: PropertyCollection;
  properties: Property[];
  publishedAt: string;
}

export function isPublishedCollectionPayload(
  value: unknown,
): value is PublishedCollectionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PublishedCollectionPayload>;
  return (
    isPropertyCollection(payload.collection) &&
    Array.isArray(payload.properties) &&
    payload.properties.length > 0 &&
    payload.properties.length <= 24 &&
    payload.properties.every(isProperty) &&
    typeof payload.publishedAt === "string"
  );
}

export async function getPublishedCollection(slug: string) {
  try {
    const result = await get(`collections/${slug}.json`, {
      access: "public",
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return undefined;
    const value = (await new Response(result.stream).json()) as unknown;
    return isPublishedCollectionPayload(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
