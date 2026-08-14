import { put } from "@vercel/blob";
import {
  isProperty,
  isPropertyCollection,
  normalizePropertyAvailability,
} from "@/lib/property-data";
import {
  isPublishedCollectionPayload,
  PublishedCollectionPayload,
} from "@/lib/published-collections";
import { authorizeStudioRequest } from "@/lib/supabase/api-auth";

function safeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72) || "property-collection"
  );
}

export async function POST(request: Request) {
  if (!(await authorizeStudioRequest())) {
    return Response.json(
      { error: "Sign in to publish collections." },
      { status: 401 },
    );
  }
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 1_000_000) {
      return Response.json({ error: "Collection is too large." }, { status: 413 });
    }

    const input = (await request.json()) as {
      collection?: unknown;
      properties?: unknown;
    };
    if (
      !isPropertyCollection(input.collection) ||
      !Array.isArray(input.properties) ||
      input.properties.length === 0 ||
      input.properties.length > 24 ||
      !input.properties.every(isProperty)
    ) {
      return Response.json(
        { error: "Add at least one valid property before publishing." },
        { status: 400 },
      );
    }

    const propertyIds = new Set(input.properties.map((property) => property.id));
    const collection = {
      ...input.collection,
      slug: safeSlug(input.collection.slug || input.collection.name),
      propertyIds: input.collection.propertyIds.filter((id) => propertyIds.has(id)),
      status: "Published" as const,
    };
    const properties = input.properties
      .filter((property) => collection.propertyIds.includes(property.id))
      .map(normalizePropertyAvailability);
    const payload: PublishedCollectionPayload = {
      collection,
      properties,
      publishedAt: new Date().toISOString(),
    };
    if (!isPublishedCollectionPayload(payload)) {
      return Response.json({ error: "Collection data is invalid." }, { status: 400 });
    }

    await put(
      `collections/${collection.slug}.json`,
      JSON.stringify(payload),
      {
        access: "public",
        contentType: "application/json; charset=utf-8",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      },
    );

    const origin = new URL(request.url).origin;
    return Response.json({
      slug: collection.slug,
      url: `${origin}/collection/${encodeURIComponent(collection.slug)}`,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The collection could not be published.",
      },
      { status: 500 },
    );
  }
}
